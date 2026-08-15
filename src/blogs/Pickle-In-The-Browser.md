---
title: "I Ran My .pkl Model in the Browser Two Ways — Pyodide vs ONNX, With Real Benchmarks"
date: 2026-08-14
author: "Tashif Ahmad Khan"
socials:
  [
    "https://www.github.com/tashifkhan",
    "https://www.linkedin.com/in/tashif-ahmad-khan-982304244/",
    "https://tashif.codes",
  ]
tags: ["Machine Learning", "Web"]
excerpt: "I took a real XGBoost news-bias classifier and made it run entirely in the browser two different ways — Pyodide unpickling the original .pkl, and ONNX via onnxruntime-web. Same model, same task, wildly different perf. Here's what actually happened, with numbers, including the trap that almost broke the whole thing."
coverImage: "/images/blog/Pickle-In-The-Browser/cover.svg"
---

<Lede>
I have this [news bias detector](https://bias-detector.tashif.codes/) — an XGBoost classifier that reads a headline and calls it left or right biased. It's been living behind a Flask API, which is fine, except every prediction is a round-trip to a server that can go cold. So I set out to run the model <em>entirely in the browser</em>. There are two real ways to do that: ship CPython to the frontend via Pyodide and unpickle the original <code>model.pkl</code>, or convert the model to ONNX and run it with <code>onnxruntime-web</code>. I did both, deployed both, benchmarked both against each other and against the backend, and one of them nearly bit me with a subtle trap that took forever to find. This is the whole story, with real numbers.
</Lede>

If you just want to poke the results, here they are live — same model, same task, two different pipelines:

- **The hub page** (with both options, "Client ML" in the navbar): [bias-detector.tashif.codes/client-ml](https://bias-detector.tashif.codes/client-ml)
- **Pyodide + .pkl path:** [bias-detector.tashif.codes/pyodide-classify](https://bias-detector.tashif.codes/pyodide-classify)
- **ONNX + onnxruntime-web path:** [bias-detector.tashif.codes/onnx-classify](https://bias-detector.tashif.codes/onnx-classify)

Both run inference 100% client-side — no server round-trip after the page loads. Everything below is re-verified against the current Pyodide 314 / sklearn 1.8 / ONNX Runtime docs.

<Toc />

## the two real answers

There is no magic "convert .pkl to browser binary" button. What you actually have is two paths:

1. **Pyodide path** — ship CPython compiled to WebAssembly, install the same packages you trained with, `pickle.loads()` the bytes, call `model.predict()` like nothing ever happened.
2. **ONNX path** — convert the estimator (ideally the whole `Pipeline`) to a static computation graph once, then run it with `onnxruntime-web` on WASM or WebGPU.

Path A is *aligning environments*. Path B is *converting formats*. That distinction drives every tradeoff below — and it's exactly where my model tried to kill me.

<Ascii label="Two browser paths: heavy Pyodide runtime unpickling the model versus lean onnxruntime-web running a static graph">
                    ┌─────────────────────────────────────────┐
  train (laptop)    │  sklearn Pipeline.fit(...)              │
                    │  dump → model.pkl   OR   export → .onnx │
                    └───────────────┬─────────────────────────┘
                                    │ serve as static asset
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Browser                                                             │
│                                                                      │
│  Path A (heavy)              Path B (lean)                           │
│  ┌──────────────────┐        ┌────────────────────────────┐          │
│  │ Pyodide WASM     │        │ onnxruntime-web            │          │
│  │ + numpy/sklearn  │        │ (wasm / webgpu)            │          │
│  │ pickle.loads()   │        │ InferenceSession.run()     │          │
│  │ model.predict()  │        │ Float32Array tensors       │          │
│  └──────────────────┘        └────────────────────────────┘          │
└──────────────────────────────────────────────────────────────────────┘
</Ascii>

### the model, in one paragraph

So we're not talking about some toy regression. The bias detector is a real pipeline: a custom `TextPreprocessor` (regex clean → drop NLTK english stopwords → WordNet lemmatize) feeding a `TfidfVectorizer` with a **66,115-term vocabulary**, then an XGBoost classifier. Test accuracy **93.6%**, F1 0.907. On the backend it lives as two pickles — `preprocess.pkl` (1.4 MB, the ColumnTransformer) and `model.pkl` (166 KB, the XGBClassifier). That custom Python preprocessor is going to be the star of the show, in the worst way.

## the version matrix (this is where everyone messes up)

If you take the Pyodide path, you pin your **training** environment to whatever your chosen Pyodide release ships. Not the other way around. Numbers below are for **Pyodide v314.0.4** — re-check the [packages list](https://pyodide.org/en/stable/usage/packages-in-pyodide.html) before you train, because these drift.

| Package | In Pyodide 314.0.4 | Why you care |
| ------- | ------------------ | ------------ |
| CDN runtime | `cdn.jsdelivr.net/pyodide/v314.0.4/full/pyodide.js` | Pin the version string; never float `@latest` in prod |
| scikit-learn | **1.8.0** | Train with this exact version before pickling |
| numpy | **2.4.3** | dtype / array-protocol edge cases if mismatched |
| scipy | **1.18.0** | Half of sklearn pulls scipy |
| joblib | **1.5.3** | joblib dumps are still pickle-protocol under the hood |
| xgboost / lightgbm | 2.1.4 / 4.6.0 | Available as built packages — still pin train versions |
| nltk | 3.9.4 | Yes, Pyodide ships NLTK — more on that below |

<Warning title="The original pickle literally would not load">
My original <code>preprocess.pkl</code> was created with sklearn 1.5.2. Pyodide ships sklearn 1.8.0 — and the load failed with <code>AttributeError: module 'sklearn.compose._column_transformer' has no attribute '_RemainderColsList'</code>. Not a warning. A hard crash. The blog-post version of this is "pin versions or get <code>InconsistentVersionWarning</code>"; the real version is "the class literally doesn't exist in the newer sklearn, your pickle is dead." Fix: re-dump the artifacts with the exact Pyodide stack (sklearn 1.8.0, xgboost 2.1.4, nltk 3.9.4). Same data, same pipeline, identical 93.6% accuracy — just serialized with versions the browser can load.
</Warning>

## path A — pyodide + .pkl

<Steps>
<Step title="Re-dump aligned with Pyodide">

Pin training to the Pyodide release, then re-serialize the pickles so they load clean in the browser:

```bash
pip install \
  "scikit-learn==1.8.0" \
  "numpy==2.4.3" \
  "scipy==1.18.0" \
  "joblib==1.5.3" \
  "xgboost==2.1.4" \
  "nltk==3.9.4"

pip freeze > requirements-pyodide-train.txt
```

Dump with protocol 5, pickle the **whole Pipeline**, and record the recipe:

```python
import pickle
from sklearn.pipeline import Pipeline

pipe.fit(X_train, y_train)

with open("model.pkl", "wb") as f:
    pickle.dump(pipe, f, protocol=5)
```

</Step>
<Step title="Ship the custom preprocessor as an importable module">

Here's the fun part. The pickle doesn't just store the <code>TextPreprocessor</code> instance — it stores the <em>class reference</em> <code>browser_preprocess.TextPreprocessor</code>, and <code>pickle.loads()</code> will try to <code>import</code> that path on unpickle. In the browser, that module doesn't exist on Pyodide's <code>sys.path</code>. The fix: serve the module as a static file, fetch it into Pyodide's virtual filesystem, add its directory to <code>sys.path</code>, then import — <em>before</em> unpickling.

```python
import sys, os
from pathlib import Path

os.makedirs("/models", exist_ok=True)
if not Path("/models/browser_preprocess.py").exists():
    Path("/models/browser_preprocess.py").write_text(
        (await _fetch_bytes("/models/browser_preprocess.py")).decode("utf-8")
    )
sys.path.insert(0, "/models")
import browser_preprocess  # now pickle.load() can resolve the class
```

This is the "custom classes must be importable inside Pyodide" trap from the docs, in the wild. My first deploy failed exactly here with <code>ModuleNotFoundError: No module named 'browser_preprocess'</code>.

</Step>
<Step title="Mount the NLTK corpora">

The <code>TextPreprocessor</code> calls <code>stopwords.words('english')</code> and <code>WordNetLemmatizer()</code> at import/predict time. NLTK needs its corpora, which are not bundled in the wheel. We serve <code>wordnet.zip</code> (10 MB) + <code>stopwords.zip</code> as static files, write them into Pyodide's FS, and point <code>nltk.data.path</code> at them:

```python
import nltk, os
from pathlib import Path

os.makedirs("/nltk_data/corpora", exist_ok=True)
for name in ["stopwords.zip", "wordnet.zip"]:
    p = Path("/nltk_data/corpora") / name
    if not p.exists():
        p.write_bytes(await _fetch_bytes("/nltk_data/corpora/" + name))
nltk.data.path.insert(0, "/nltk_data")
```

</Step>
<Step title="Unpickle and predict">

<code>pickle.loads(bytes)</code> both pickles, then <code>preprocess.transform()</code> → <code>model.predict()</code>, exactly like the backend does.

</Step>
</Steps>

The key browser code — this is basically the whole Pyodide path, condensed:

```js
const pyodide = await loadPyodide();                       // CPython in WASM
await pyodide.loadPackage(["scikit-learn", "xgboost", "nltk", "pandas"]);

await pyodide.runPythonAsync(`
import pickle
preprocess = pickle.loads(await _fetch_bytes("/models/preprocess.pkl"))
model = pickle.loads(await _fetch_bytes("/models/model.pkl"))
`);

// then per prediction:
const pred = await pyodide.runPythonAsync(`
features = preprocess.transform(pd.DataFrame({"text": [TEXT]}))
int(model.predict(features)[0])
`);
```

And it works. Cold start boots CPython, installs the scientific stack, mounts WordNet, and unpickles both models in **~7.3 seconds** on my machine. Then each prediction is a genuinely correct call through the original pipeline — I verified it against the backend's own predictions on a golden set.

But look at the number. **7.3 seconds.** That's a Web Worker's worth of "please wait," and it's the honest price of Path A.

<Warning title="Pickle the Pipeline, not the estimator">
If training did <code>StandardScaler → PCA → LogisticRegression</code> and you only pickled the last step, congratulations: you now get to reimplement every transform in JS, and you <em>will</em> ship training–serving skew. Same energy for <code>OneHotEncoder</code> (set <code>handle_unknown</code> at train time), <code>TfidfVectorizer</code> (huge vocab = WASM heap pain), and <code>FunctionTransformer</code> with a lambda (needs cloudpickle, still insecure, ONNX can't help you either — rewrite the transform).
</Warning>

## the part where i scare you: pickle is eval

sklearn's docs say it. Pyodide's FAQ says it. Python's docs say it. Loading an untrusted pickle is arbitrary code execution — a malicious `.pkl` runs Python *on unpickle*, before `predict()` is even a thought.

<Danger title="Threat model, browser edition">
Yes, WASM sandboxes it to the page origin. No, that doesn't save you — code running in the page origin can read JS-reachable storage, exfiltrate whatever the user types, mine crypto, or just freeze the tab. And if your model CDN gets compromised, Path A is game over. Rules: only ship models you built, serve them over HTTPS with immutable caching (SRI if you can), never unpickle a user-uploaded <code>.pkl</code> "for convenience," and if third-party models are a requirement, look at skops.io — or better, take Path B so there's no pickle surface at all.
</Danger>

## path B — ONNX + onnxruntime-web

ONNX is a static computation graph. You lose the live Python object; you gain a small runtime, version decoupling, no pickle RCE surface, a WebGPU path for heavier things, and a format sklearn itself recommends when all you need is predictions.

### the trap that almost broke everything

This is the part I want you to remember, because it's a real xgboost footgun I've never seen written down anywhere.

My original model was trained on a **sparse** TF-IDF matrix (that's what `TfidfVectorizer.transform()` returns by default). XGBoost treats sparse zeros as *missing values*. When you run the same booster on a **dense** array — which is what ONNX needs, since it's all float tensors — those zeros become real zeros, the missing-value handling kicks in differently, and the model goes from **93.6% accurate to 68% accurate**. Silent. No error. Just wrong predictions.

<Panel title="The sparse-vs-dense xgboost trap" tone="warn" icon="alert-triangle">
The same <code>model.pkl</code>, same 200 test samples, predicted through the sparse path vs the dense path, only agree <strong>65%</strong> of the time. Sparse input: 93.6% accuracy. Dense input: 68.5%. XGBoost's missing-value handling makes them behave like two different models. ONNX runtime takes dense tensors, so you cannot ship the sparse-trained model as-is.
</Panel>

The fix, which is also the honest engineering answer: **retrain the classifier on dense features** for the ONNX export. Same preprocessing, same data, same XGBoost — just fed a `.toarray()` instead of the sparse matrix. Result:

- Dense-trained test accuracy: **93.4%** (vs 93.6% sparse)
- The two models agree on **97.7%** of the test set

That 2.3% disagreement is real and it matters — I fed both browser paths the same Trump/tariffs headline and Pyodide said LEFT while ONNX said RIGHT. Both are "correct" for their own training representation; they just diverge on edge cases. If you're ever showing users "accuracy: X%", know that the number is tied to *which* model you actually deployed.

### converting it

Because the custom `TextPreprocessor` can't be expressed as ONNX ops, and the TfidfVectorizer's tokenizer doesn't convert faithfully either (I measured skl2onnx's TextVectorizer agreeing with sklearn's tokenizer only ~65% of the time on predictions), the split is: **preprocessing + TF-IDF run in JS, XGBoost runs as the ONNX graph.**

```bash
pip install skl2onnx onnxruntime onnx onnxmltools
```

```python
# export the dense-retrained XGBoost booster to ONNX
from onnxmltools import convert_xgboost
from onnxmltools.convert.common.data_types import FloatTensorType

model_onnx = convert_xgboost(
    booster,
    initial_types=[("features", FloatTensorType([None, n_features]))],
    target_opset=15,
)

# dump vocab + idf + norm + lemma table + stopwords for the JS feature builder
with open("model_meta.json", "w") as f:
    json.dump(meta, f)
```

The JS feature builder reproduces sklearn's `TfidfVectorizer.transform()` exactly — same lowercase, same `[^a-zA-Z0-9\s-]` cleanup, same stopword set, same WordNet lemmatization (via a precomputed word→lemma table so we don't need NLTK in the browser), same `(?u)\b\w\w+\b` token pattern, same idf weighting, same L2 norm. I verified the ONNX predictions match sklearn's dense model on **100% of 300 test samples**.

### running it in the browser

```bash
npm install onnxruntime-web
```

```js
import * as ort from "onnxruntime-web";
ort.env.wasm.wasmPaths = "/ort-wasm/"; // serve the WASM runtime yourself

async function runInference(features /* Float32Array, length 66115 */) {
  const session = await ort.InferenceSession.create("/models/model.onnx", {
    executionProviders: ["wasm"],
  });
  const tensor = new ort.Tensor("float32", features, [1, 66115]);
  const results = await session.run({ features: tensor });
  return results.label.data[0]; // 0 = left, 1 = right
}
```

One operational gotcha: onnxruntime-web wants several WASM variants (`.jsep.mjs`, `.jspi.mjs`, asyncify, etc.), and Next.js won't magically copy them into `public/`. Copy the whole `dist/*.wasm` + `*.mjs` set into `public/ort-wasm/` or it'll 404 on a dynamically-imported module at runtime.

## the head-to-head, measured

Same machine, same browser (Chrome, desktop), same model task. These are real numbers from the live site, measured via `performance.now()` in the page — the same tab you can open right now.

<Kpi cols={3}>
<Stat value="8,502" label="ms cold start · Pyodide" tone="accent" />
<Stat value="1,333" label="ms warm inference · Pyodide" tone="accent" />
<Stat value="12" label="ms warm inference · ONNX" tone="ok" />
</Kpi>

| Metric | Pyodide + .pkl | ONNX + ORT Web |
| ------ | -------------- | -------------- |
| **Cold start (first load → model ready)** | **8,502 ms** | **3,925 ms** |
| **Warm inference (one prediction)** | **1,333 ms** | **12 ms** |
| Total transfer on first load | ~49 MB | ~17.6 MB |
| Test accuracy | 93.6% | 93.4% |
| Models agree on test set | — | 97.7% |
| Pickle RCE surface | Yes | No |
| Version coupling | Train ≡ browser, exactly | Graph self-contained |

The load numbers are the interesting part, and they *flip* depending on cache state. First run ever: ONNX cold start (16 s) is worse than Pyodide (7.3 s) because the 13.5 MB WASM runtime ships from my own origin and has to compile, while Pyodide's whole stack streams from jsDelivr's CDN. But once the WASM is CDN-cached, ONNX's load collapses to **3.9 s** — faster than Pyodide. Pyodide's cold start stays ~7–8.5 s because every new visitor re-downloads ~27 MB of wheels + WordNet; the browser caches help, but it's a big static payload either way.

The inference numbers are the story. **1.3 seconds vs 12 milliseconds.** That's ~100x. Per prediction. If a user scrolls a feed of 50 articles and each one reclassifies as it loads, Pyodide means 65 seconds of jank while ONNX means 0.6 seconds. And those predictions from Pyodide each run through a full Python interpreter round-trip with the 66k-dim sparse transform on a 1.4 MB pickled ColumnTransformer — it's doing real work, it's just *heavy*.

<InkBand title="what the measurements actually say">
The blog-faithful punchline is real: Pyodide is the "I already have the pkl and it's a demo" path, ONNX is the "real users will touch this" path. But my numbers add a twist — ONNX's cold start was <em>worse</em> than Pyodide's on the very first uncached load (WASM download + compile), so "ONNX loads faster" isn't automatically true. What IS unambiguously true: ONNX inference is ~100x faster, the asset footprint is ~3x lighter, and there's no pickle security surface. And the sparse-vs-dense xgboost trap means you must retrain dense for the ONNX path or you silently ship a 68% model.
</InkBand>

## failure modes, aka how you'll actually break this

<Panel title="pkl: the pickle is dead on the new sklearn" tone="warn" icon="alert-triangle">
My 1.5.2-era <code>preprocess.pkl</code> hard-crashed on sklearn 1.8.0 (<code>_RemainderColsList</code> gone). Re-dump with the exact Pyodide stack. Catch <code>InconsistentVersionWarning</code> in local tests before the browser ever sees the file.
</Panel>

<Panel title="pkl: ModuleNotFoundError on unpickle" tone="warn" icon="alert-triangle">
Pickle records import paths. Custom classes must be importable inside Pyodide — fetch the <code>.py</code> into the virtual FS, add it to <code>sys.path</code>, then import before <code>pickle.load</code>.
</Panel>

<Panel title="onnx: sparse-trained xgboost gives wrong dense answers" tone="danger" icon="alert-triangle">
The single most dangerous one. Sparse-trained booster, dense input → 68% accuracy, silent. Retrain the classifier on <code>.toarray()</code> features, then validate ONNX-vs-sklearn agreement on a golden set before shipping.
</Panel>

<Panel title="onnx: TextVectorizer tokenizer drift" tone="warn" icon="alert-triangle">
skl2onnx's TextVectorizer doesn't reproduce sklearn's exact tokenization (~65% prediction agreement in my test). Do the preprocessing in JS against an exported vocab/idf/lemma/stopword table, and verify 100% agreement on samples.
</Panel>

<Panel title="net: CORS / file:// / missing wasm variants" tone="warn" icon="alert-triangle">
Serve over HTTP(S). Copy all onnxruntime-web <code>*.wasm</code> + <code>*.mjs</code> into <code>public/</code> or a dynamically-imported module 404s at runtime. NLTK corpora must be reachable for Pyodide to load them into its FS.
</Panel>

## ship checklist

<Checklist title="Before this goes near users">
- [ ] Decided the path honestly: Pyodide for demo, ONNX for product
- [ ] Recorded the Pyodide tag + package versions used for training
- [ ] Re-dumped pickles with the exact Pyodide stack; retrained dense for ONNX
- [ ] Golden set: browser predictions match local within tolerance (mine: 7/8 + 100% ONNX agreement)
- [ ] Model served over HTTPS, CORS correct, immutable cache / SRI if CDN
- [ ] Loading UI + error states for both runtime and model fetch
- [ ] Mobile memory smoke test with the production model size
- [ ] No user-supplied pickle unpickling, anywhere, ever
- [ ] If ONNX: verified input/output names + float32 shapes
- [ ] Retrain/export recipe documented next to the artifact
</Checklist>

## the honest bottom line

I shipped the same news-bias model to the browser twice, and both work — you can try them at [bias-detector.tashif.codes/pyodide-classify](https://bias-detector.tashif.codes/pyodide-classify) and [bias-detector.tashif.codes/onnx-classify](https://bias-detector.tashif.codes/onnx-classify) (or start from the [client-ml hub](https://bias-detector.tashif.codes/client-ml)). If it's a demo and you already have the pkl, Pyodide is genuinely lovely: same API, no conversion, and the cold start is actually decent because the runtime comes from a fast CDN. If real users will run predictions more than a handful of times, ONNX wins by a mile on per-inference cost, asset size, and security — once you've survived the sparse-vs-dense retrain trap and moved your preprocessing into JS.

Never unpickle strangers, never float versions, never skip validating the ONNX output against sklearn on a golden set.

<Hand>
if you take the Pyodide path: pin everything, and say a small prayer to the version gods before your first predict.
</Hand>

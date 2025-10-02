---
title: "Unpacking Git: A Journey Under the Hood of Version Control"
date: 2025-06-23
author: "Tashif Ahmad Khan"
socials:
  [
    "https://www.github.com/tashifkhan",
    "https://www.linkedin.com/in/tashif-ahmad-khan-982304244/",
    "https://tashif.codes",
  ]
tags: ["git", "version control", "programming"]
excerpt: "A deep dive into the core components that make Git possible."
---

Git. For many, it's the indispensable tool that orchestrates our code, tracks our progress, and saves us from countless headaches. We use `git add`, `git commit`, `git push`, and `git pull` almost instinctively. But have you ever stopped to wonder what's truly happening when you type those commands? How does Git manage to track every change, enable seamless collaboration, and allow us to travel through time in our codebase?

The magic of Git lies in its elegant simplicity and robust underlying data structures. Unlike older version control systems that focused on storing diffs (differences between file versions), Git's core philosophy is that of a **content-addressable filesystem**. It sees your project not as a series of changes, but as a series of **snapshots**. Every time you commit, Git takes a picture of your entire project and stores it efficiently.

Let's dive deeper into the core components that make this possible.

### The Immutable Building Blocks: Git Objects

At its heart, Git is a database of four primary object types, each identified by a unique SHA-1 hash of its content. This cryptographic hashing is what gives Git its incredible integrity – if even a single bit of an object changes, its hash changes, making tampering immediately detectable.

1.  **Blob (Binary Large Object):**

    - **What it stores:** The exact content of a file. It doesn't store file names or paths, just the raw data.
    - **Analogy:** Think of it as a pure text file or an image file, completely devoid of context beyond its content.

2.  **Tree Object:**

    - **What it stores:** Represents a directory. It contains a list of pointers to other Git objects (blobs and/or other tree objects) along with their file names, file modes (permissions), and object types.
    - **Analogy:** A directory listing. It tells you "this directory contains a file named 'main.py' (which is this blob) and a subdirectory named 'src' (which is this other tree)."

3.  **Commit Object:**

    - **What it stores:** This is the most crucial object for understanding your project's history. A commit object points to a single **tree object** (representing the complete snapshot of your project's files at that moment), the author's name and email, the committer's name and email, the commit message, and most importantly, one or more **parent commit(s)**.
    - **Analogy:** A historical record. "At this specific point in time, the project looked exactly like this (points to a tree), these are the people who made the change, this is why they made it, and this change builds upon this previous change (points to parent commits)."

4.  **Tag Object (Annotated Tags):**
    - **What it stores:** A permanent pointer to a specific commit. Unlike lightweight tags (which are just references), annotated tags are full Git objects themselves. They store the tagger's name, email, date, and a tagging message, along with a pointer to the commit they reference.
    - **Analogy:** A permanent bookmark or release marker. "This specific commit marks version 1.0 of our software, and here's who tagged it and why."

### References (Refs): Your Navigational Pointers

While objects are the immutable data, **references (refs)** are the mutable pointers that help you navigate your project's history. They are essentially files in the `.git/refs` directory that contain the SHA-1 hash of a commit object.

- **Branches:** A branch (e.g., `master`, `main`, `feature-x`) is simply a lightweight, movable pointer to a commit. When you create a new commit on a branch, that branch's pointer automatically moves forward to point to the new commit.
- **Tags:** As mentioned, lightweight tags are just references to commits. Annotated tags are Git objects that _then_ point to a commit.
- **HEAD:** This is the most important reference. `HEAD` is a symbolic reference that points to the branch you are currently working on. When you `git checkout feature-x`, `HEAD` now points to `refs/heads/feature-x`. When you commit, the branch that `HEAD` points to moves forward.

### Branching: A Simple Pointer Game

Given Git's object model and ref system, branching becomes incredibly simple and cheap.

When you run `git branch new-feature`:

1.  Git finds the commit that your current `HEAD` points to.
2.  It creates a new reference, `refs/heads/new-feature`, and makes it point to the exact same commit.

That's it! No copying of files, no complex operations. A new branch is just a new, lightweight pointer.

When you `git checkout new-feature`:

1.  Git updates `HEAD` to point to `refs/heads/new-feature`.
2.  It updates your working directory to match the snapshot of the commit that `new-feature` points to.

As you make commits on `new-feature`, the `new-feature` pointer moves forward, while your `main` (or `master`) branch pointer remains unchanged, pointing to its last commit. This is how development can diverge independently.

```
      A -- B -- C (main)
           ^
           |
           D -- E (new-feature)
           ^
           |
          HEAD (after checkout new-feature)
```

### Merging: Weaving Histories Together

When separate lines of development need to be brought together, Git offers merging.

1.  **Fast-Forward Merge:**

    - **When it happens:** If the branch you're merging _into_ (e.g., `main`) is an ancestor of the branch you're merging _from_ (e.g., `feature-x`). This means `main` hasn't had any new commits since `feature-x` branched off.
    - **How it works:** Git simply moves the pointer of the target branch (`main`) forward to the latest commit of the source branch (`feature-x`). No new commit is created.

    ```
          A -- B (main)
                \
                 C -- D (feature-x)

          # git checkout main
          # git merge feature-x

          A -- B -- C -- D (main, feature-x)
    ```

2.  **Three-Way Merge (Recursive Merge):**

    - **When it happens:** If the target branch has new commits that are _not_ on the source branch, and the source branch has new commits _not_ on the target branch. The histories have diverged.
    - **How it works:**
      1.  Git finds the **common ancestor** commit between the two branches.
      2.  It identifies the changes made on the target branch since the common ancestor.
      3.  It identifies the changes made on the source branch since the common ancestor.
      4.  Git attempts to combine these changes.
      5.  A new **merge commit** is created. This special commit has _two_ parent commits: the tip of the target branch and the tip of the source branch. Its tree object represents the combined state of the project.

    ```
          A -- B -- C (main)
                \      \
                 D -- E -- M (merge commit)
                         /
                       F -- G (feature-x)

          # git checkout main
          # git merge feature-x
    ```

    - **Conflict Resolution:** If Git cannot automatically combine changes (e.g., the same line was modified differently in both branches), it marks a **merge conflict**. You then manually resolve these conflicts in your files, add them, and commit the merge.

### Rebasing: Rewriting History for a Linear Path

Rebasing is an alternative to merging that allows you to integrate changes from one branch onto another by **replaying** commits. Instead of creating a merge commit, it rewrites the history of your branch to appear as if it branched off at a later point.

When you `git rebase main` from your `feature-x` branch:

1.  Git identifies the common ancestor between `feature-x` and `main`.
2.  It finds all commits on `feature-x` that are _not_ on `main`. These are temporarily stored.
3.  `feature-x` is "rewound" back to the common ancestor.
4.  The `feature-x` branch pointer is then moved to the tip of the `main` branch.
5.  Git then reapplies (or "replays") each of the temporarily stored commits from `feature-x` one by one on top of the new base (`main`). For each replayed commit, a **new commit object** is created with a new SHA-1 hash.

```
          A -- B -- C (main)
                \
                 D -- E (feature-x)

          # git checkout feature-x
          # git rebase main

          A -- B -- C -- D' -- E' (feature-x)
                      ^
                      |
                     (main)
```

Notice `D'` and `E'` are new commits. Their content is identical to `D` and `E`, but their parent is now `C`, not `B`, and thus their SHA-1 hashes are different.

**Key Differences & When to Use:**

- **Merge:** Preserves history exactly as it happened. Creates a merge commit, showing the divergence and convergence. Ideal for integrating feature branches into shared branches (`main`/`develop`) to maintain an accurate, non-linear history.
- **Rebase:** Creates a linear history by rewriting commits. Useful for cleaning up your local feature branch before merging it into a shared branch. It avoids "noisy" merge commits.

**Important Warning about Rebasing:**
**Never rebase commits that have already been pushed to a shared remote repository and other people might have pulled!** Because rebase rewrites history (creates new commit objects), it can cause significant problems for collaborators who have based their work on the "old" commits. This leads to conflicting histories and messy merges down the line. Rebase only on local, unpushed branches, or branches where you are absolutely certain no one else has based their work on.

### Conclusion

Git's power comes from its elegant and efficient design, rooted in its object model and content-addressable nature. Understanding how blobs, trees, and commits form snapshots, how references like branches and `HEAD` navigate these snapshots, and how merging and rebasing manipulate this history empowers you to wield Git with greater confidence and control. The next time you type a Git command, remember the fascinating ballet of pointers and immutable objects happening silently beneath the surface, ensuring the integrity and flexibility of your codebase.

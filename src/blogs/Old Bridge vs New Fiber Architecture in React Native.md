# Old Bridge vs New Fiber Architecture in React Native
Created: 9/24/2025, 3:39:12 PM
Last Updated: 9/24/2025, 3:39:12 PM
---

### User

difference between the old bridge and the new fiber archeture or react native


---

### Assistant (gemini-2.5-flash-thinking)

<details>
<summary>Reasoning</summary>

**Clarifying Architecture Differences**

I'm currently focused on the distinctions between React Native's old bridge and the new Fiber architecture. I'm aiming to provide a clear explanation of each, emphasizing their architectural differences and highlighting the benefits of Fiber. I'm working to make this a concise explanation for an expert audience.


**Dissecting Old Bridge**

I've been drilling down into the legacy "Old Bridge" architecture of React Native, outlining its structure, components (JS, Native UI, Shadow Tree, JSI), and the performance bottlenecks inherent in its design. The goal is to provide a solid foundation for comparing it to the new architecture. My focus now is solidifying the explanation of the "Old Bridge's" communication pathway, and the impact of the JSON serialization overhead.


**Refining Bridge Definition**

I'm now diving deeper into the "Old Bridge," specifically concentrating on its performance limitations stemming from JSON serialization/deserialization and the asynchronous nature of the communication between JavaScript and native environments. My focus is on clearly illustrating these bottlenecks and how they impact performance. I'm also working to succinctly depict the flow of data through the bridge.


**Analyzing New Architecture**

I've been working on detailing the components of the new architecture. My plan is to explain JSI, TurboModules, Fabric (leveraging React's Fiber), and Codegen, highlighting how they enable direct, more efficient communication and improved performance. I'm focusing on the differences in communication flow compared to the old bridge. I will also incorporate an explanation of the asynchronous and synchronous communication that takes place.


**Comparing Architectures Now**

I'm now fully immersed in comparing and contrasting the "Old Bridge" and the new architecture, specifically the role of Fabric, TurboModules, JSI, and Codegen. I'm focusing on the architectural changes and the performance improvements. I will present a side-by-side comparison that clarifies the benefits. I'm focusing on the synchronous nature of the new architecture for speed.

I've been working to compare the old and new architectures to define differences between React Native. I'm defining the "old bridge's" limitations and the corresponding solutions within the new architecture. I'm focusing on how asynchronous communication and serialization overhead were addressed. My goal is to clearly relate the improvements in the new approach.


**Refining the New Approach**

I'm now outlining the New Architecture, focusing on Fabric, JSI, TurboModules, and Codegen, and how they work synergistically. I'm making direct comparisons, emphasizing the move from asynchronous to synchronous communication. I will also incorporate the concept of the synchronous, direct calls that occur with the New Architecture.

I've been working to compare the old and new architectures to define differences between React Native. I'm defining the "old bridge's" limitations and the corresponding solutions within the new architecture. I'm focusing on how asynchronous communication and serialization overhead were addressed. My goal is to clearly relate the improvements in the new approach.


**Reflecting on Comparisons**

I'm synthesizing the differences between the "Old Bridge" and the new architecture, specifically the asynchronous vs. synchronous communication aspects and their impact on performance. I'm focusing on highlighting the advancements that the new architecture brings. The goal is to define the crucial architectural features.
I'm now outlining the New Architecture, focusing on Fabric, JSI, TurboModules, and Codegen, and how they work synergistically. I'm making direct comparisons, emphasizing the move from asynchronous to synchronous communication. I will also incorporate the concept of the synchronous, direct calls that occur with the New Architecture.

I've been working to compare the old and new architectures to define differences between React Native. I'm defining the "old bridge's" limitations and the corresponding solutions within the new architecture. I'm focusing on how asynchronous communication and serialization overhead were addressed. My goal is to clearly relate the improvements in the new approach.


**Revisiting Architectural Approaches**

I'm now integrating the old and new methods, focusing on synchronous calls, JSI integration, and the overall architectural simplification to enhance performance. My goal is to synthesize the communication changes with the architectural overhaul. I will show how Fabric's architecture integrates with the new system to create smooth, fast communication.
I'm synthesizing the differences between the "Old Bridge" and the new architecture, specifically the asynchronous vs. synchronous communication aspects and their impact on performance. I'm focusing on highlighting the advancements that the new architecture brings. The goal is to define the crucial architectural features.


**Summarizing Architecture Evolution**

I'm now integrating the old and new methods, focusing on synchronous calls, JSI integration, and the overall architectural simplification to enhance performance. My goal is to synthesize the communication changes with the architectural overhaul. I will show how Fabric's architecture integrates with the new system to create smooth, fast communication.
I'm synthesizing the differences between the "Old Bridge" and the new architecture, specifically the asynchronous vs. synchronous communication aspects and their impact on performance. I'm focusing on highlighting the advancements that the new architecture brings. The goal is to define the crucial architectural features.


**Revising Architecture Outlines**

I'm now integrating the old and new methods, focusing on synchronous calls, JSI integration, and the overall architectural simplification to enhance performance. My goal is to synthesize the communication changes with the architectural overhaul. I will show how Fabric's architecture integrates with the new system to create smooth, fast communication.
I'm now integrating the old and new methods, focusing on synchronous calls, JSI integration, and the overall architectural simplification to enhance performance. My goal is to synthesize the communication changes with the architectural overhaul. I will show how Fabric's architecture integrates with the new system to create smooth, fast communication.



</details>

That's an excellent and very relevant question for anyone working with or planning to work with React Native! The shift from the "old bridge" to the "new Fiber architecture" (which is often referred to simply as the "New Architecture" in React Native) represents a fundamental rethinking of how React Native apps communicate and render. It aims to address many of the performance and development experience bottlenecks of the previous design.

Let's break down each architecture and then highlight their key differences.

### The Old Bridge Architecture (Legacy Architecture)

The "old bridge" architecture was React Native's original communication and rendering mechanism. Its core principle was to create a "bridge" between the JavaScript thread (where your React code runs) and the Native threads (UI thread for rendering, main thread for native modules).

**Key Components & How it Worked:**

1.  **JavaScript Thread:** This is where your React application code, business logic, and Redux/state management all run. When React determines that a UI update is needed, it computes the changes in its Virtual DOM.
2.  **The Bridge:** This is the core communication layer. It's essentially a C++ layer that facilitates asynchronous, serialized message passing between JavaScript and native code.
    *   When JavaScript needs to update the UI or call a native module, it serializes the data (often into JSON) and sends it across the bridge.
    *   When native code needs to send an event back to JavaScript (e.g., a touch event), it does the same.
    *   This communication is asynchronous, meaning JavaScript doesn't wait for the native side to finish before continuing its own execution.
3.  **Native UI Thread:** On iOS and Android, this thread is responsible for actually rendering the native UI components (like `UIView`s on iOS or `TextView`s on Android). It receives layout commands and component updates from the bridge.
4.  **Shadow Tree (Yoga):** Before UI components are rendered natively, their layout needs to be calculated. React Native uses a C++ library called Yoga (an implementation of Flexbox) to calculate the layout of components in a "shadow tree." This tree is then translated into native layout commands for the UI thread.
5.  **Native Modules:** These are native code (Java/Kotlin for Android, Objective-C/Swift for iOS) that expose device-specific functionalities (e.g., accessing the camera, location services, Bluetooth) to the JavaScript side via the bridge.

**Limitations of the Old Bridge:**

*   **Asynchronous Communication Overhead:** The serialization (e.g., JSON stringifying) and deserialization of messages across the bridge introduce latency and CPU overhead, especially for frequent updates (like animations, gestures, or large data transfers). This often led to "bridge bottlenecks" and dropped frames, resulting in a less smooth user experience.
*   **Single JavaScript Thread Bottleneck:** The JavaScript thread handled not only your app logic but also all communication with the bridge. If the JS thread was busy with heavy computations, UI updates could be delayed.
*   **No Direct Interop:** JavaScript couldn't directly call native methods or hold references to native objects. Everything had to go through the asynchronous message queue of the bridge.
*   **Difficulty in Debugging:** Tracing issues across the asynchronous JavaScript-to-native boundary could be complex.
*   **Bundle Size and Startup Time:** All native modules often had to be loaded and initialized at startup, contributing to larger bundle sizes and slower app launch times.

### The New Fiber Architecture (New Architecture / JSI-based Architecture)

The "New Architecture" in React Native is a comprehensive re-imagining of its core, moving away from the asynchronous bridge to synchronous, direct communication between JavaScript and Native. While "Fiber" itself is the reconciliation engine within React (which React Native *leverages*), the "new Fiber architecture" in React Native specifically refers to the combination of **JSI, Fabric, TurboModules, and Codegen.**

**Key Goals:**

*   **Eliminate Bridge Bottlenecks:** Achieve direct, synchronous communication between JavaScript and Native.
*   **Improve Performance:** Faster UI updates, smoother animations, and quicker module access.
*   **Type Safety:** Reduce common errors by ensuring consistent interfaces between JS and Native.
*   **Better Developer Experience:** Simpler integration of native code, easier debugging.
*   **Enable Concurrent Features:** Pave the way for React's Concurrent Mode capabilities in React Native.

**Key Components & How it Works:**

1.  **JavaScript Interface (JSI):** This is the foundational piece that replaces the bridge. JSI is a lightweight C++ layer that allows JavaScript to *directly hold references to C++ objects and invoke methods on them*, and vice-versa. This means JavaScript can now call native functions synchronously without serialization overhead.
    *   **Impact:** This is the game-changer. It transforms communication from asynchronous message passing to direct, synchronous C++ function calls.
2.  **Fabric (New Renderer):** This is the replacement for the old UI Manager and Shadow Tree. Fabric is a **C++ rendering layer** that manages a cross-platform "shadow tree" (similar to Yoga, but more tightly integrated).
    *   It uses JSI to expose native UI components directly to JavaScript.
    *   It allows for **synchronous layout calculations and UI updates**, significantly reducing UI jank.
    *   It's designed to align with React Fiber's reconciliation algorithm, enabling features like concurrent rendering (where React can prioritize and interrupt rendering tasks) and more efficient batching of UI updates.
    *   It creates a "unified" native view hierarchy that is closer to how actual native apps are built.
3.  **TurboModules (New Native Modules):** These are the next generation of Native Modules, built on top of JSI.
    *   They enable **direct, synchronous calls** from JavaScript to native modules.
    *   They support **lazy loading**, meaning a native module is only loaded when it's actually needed, improving app startup time and memory footprint.
    *   They significantly reduce the overhead of communicating with native device capabilities.
4.  **Codegen:** This is a build-time tool that automatically generates interface code (TypeScript for JavaScript, and Objective-C++/Java/Kotlin for native) for TurboModules and Fabric components.
    *   **Impact:** It ensures **type safety** and consistency between JavaScript and native code, preventing mismatches and reducing boilerplate code. This is a huge win for developer experience and reliability.

### Key Differences Summarized

| Feature              | Old Bridge Architecture                                                                 | New Fiber Architecture (JSI + TurboModules + Fabric)                                                |
| :------------------- | :-------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------- |
| **Communication**    | **Asynchronous message passing** (serialized JSON) over a C++ bridge.                   | **Synchronous, direct C++ calls** via JSI, enabling direct function calls between JS and native.      |
| **Performance**      | Suffers from serialization/deserialization overhead and bridge bottlenecks, leading to potential UI lag. | Significantly **improved performance**, reduced overhead, smoother UI and animations due to direct calls. |
| **Native Modules**   | Exposed via the bridge; often loaded eagerly; asynchronous calls.                       | **TurboModules:** Leverages JSI for synchronous, direct, **lazy-loaded** modules with type safety.   |
| **UI Rendering**     | **UI Manager** & **Yoga (Shadow Tree)**: Asynchronous layout/update commands sent over the bridge. | **Fabric:** C++ rendering engine built on Fiber principles, enabling **synchronous layout and UI updates**, concurrent rendering. |
| **Type Safety**      | Manual checks; prone to mismatches between JS and native interfaces.                    | **Codegen:** Automatically generates type-safe interfaces for both JS and native, ensuring consistency. |
| **Concurrency**      | Limited to JS thread; UI updates are mostly sequential.                                 | Designed to enable React's **Concurrent Mode**, allowing for interruptible and priority-based rendering. |
| **Debugging**        | Challenging due to asynchronous boundaries and serialization.                           | Easier debugging due to synchronous calls and type-safe interfaces.                                 |
| **Architecture**     | JS thread, Bridge (C++), Native threads (Android/iOS) – distinct separation.             | JS, JSI (C++ common denominator), Native – tighter integration and unification.                     |

### Why is it called "Fiber Architecture" in React Native?

It's important to clarify: **React Fiber** is the reconciliation algorithm introduced in React 16 for web and native. It allows React to break down rendering work into smaller chunks, pause and resume work, and prioritize updates. This enables features like Concurrent Mode and Suspense.

When we talk about the "New Fiber Architecture" in React Native, we are referring to the fact that the new rendering system, **Fabric**, is specifically designed to work hand-in-hand with React Fiber. Fabric effectively translates React Fiber's output (the desired UI tree) into native UI commands in a highly efficient and synchronous manner. So, while JSI, TurboModules, Fabric, and Codegen are the technical components, the entire system is built to leverage and support the capabilities that React Fiber brings to the table, especially concurrent rendering.

### Conclusion

The new Fiber architecture (the New Architecture) in React Native is a monumental shift that addresses the fundamental performance and developer experience limitations of the old bridge. By replacing the asynchronous bridge with synchronous JSI, introducing Fabric for a more efficient rendering pipeline, enabling lazy-loaded and type-safe TurboModules, and automating interface generation with Codegen, React Native is becoming a more performant, robust, and developer-friendly platform.

Do you have any specific aspects of this architecture that you'd like to dive deeper into, perhaps how it might impact a particular feature you're working on, or the migration process for existing apps?


---

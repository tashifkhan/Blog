---
title: "useRef vs useState in React: Understanding the Fundamental Difference"
date: 2025-09-24
author: "Tashif Ahmad Khan"
socials:
  [
    "https://www.github.com/tashifkhan",
    "https://www.linkedin.com/in/tashif-ahmad-khan-982304244/",
    "https://tashif.codes",
  ]
tags: ["react", "react native", "hooks", "useref", "usestate"]
excerpt: "Confused about when to use useRef versus useState? Let's break down these two fundamental React hooks and when to use each one."
---

# useRef vs useState in React: Understanding the Fundamental Difference

If you're working with React or React Native, you've probably encountered both `useState` and `useRef`. At first glance, they might seem similar - both let you store values in your components. But use them interchangeably, and you'll quickly run into confusing bugs or performance issues.

The key difference? **`useState` triggers re-renders, `useRef` doesn't.** But there's much more to the story. Let's dive deep into both hooks and understand when to use each one.

## useState: The Reactive State Manager

`useState` is probably the first hook you learned in React. It's the go-to solution for managing data that affects what users see on screen.

### How useState Works

When you call `useState`, you get back an array with two elements:

```javascript
const [value, setValue] = useState(initialValue);
```

- `value` - The current state
- `setValue` - A function to update that state
- `initialValue` - What the state starts as

Here's a classic example:

```javascript
import React, { useState } from "react";

function Counter() {
	const [count, setCount] = useState(0);

	return (
		<div>
			<p>You clicked {count} times</p>
			<button onClick={() => setCount(count + 1)}>Click me</button>
		</div>
	);
}
```

### The Magic of Re-rendering

The crucial thing about `useState`: **calling `setValue` triggers a re-render**. This is exactly what you want when data changes and the UI needs to update.

When you click the button:

1. `setCount(count + 1)` is called
2. React schedules a re-render
3. The component function runs again
4. The new `count` value is displayed

This reactive behavior is what makes React... well, React!

### Common useState Use Cases

- **Form inputs**: Text fields, checkboxes, radio buttons
- **Toggle states**: Modal open/closed, menu expanded/collapsed
- **API data**: Results from fetch requests
- **Counters and timers**: Any number that updates visually
- **Lists**: Dynamic arrays of items to display
- **Visibility flags**: Showing/hiding components

## useRef: The Silent Value Keeper

`useRef` is quite different. It returns a mutable object that persists for the component's entire lifetime:

```javascript
const myRef = useRef(initialValue);
```

You get back an object with a single property: `current`. You can read from and write to `myRef.current` freely, and React won't bat an eye - no re-renders triggered.

### Accessing DOM Elements

The most common use case is getting direct access to DOM elements:

```javascript
import React, { useRef } from "react";

function TextInputWithFocusButton() {
	const inputRef = useRef(null);

	const handleClick = () => {
		// Directly access the input element
		inputRef.current.focus();
	};

	return (
		<>
			<input ref={inputRef} type="text" />
			<button onClick={handleClick}>Focus the input</button>
		</>
	);
}
```

When you attach a ref to a React element with `ref={inputRef}`, React sets `inputRef.current` to point to the actual DOM node.

### Storing Values Between Renders

You can also use `useRef` to store any value that needs to persist but shouldn't trigger re-renders:

```javascript
import React, { useState, useRef, useEffect } from "react";

function Stopwatch() {
	const [seconds, setSeconds] = useState(0);
	const intervalRef = useRef(null);

	const start = () => {
		if (intervalRef.current !== null) return; // Already running

		intervalRef.current = setInterval(() => {
			setSeconds((s) => s + 1);
		}, 1000);
	};

	const stop = () => {
		clearInterval(intervalRef.current);
		intervalRef.current = null;
	};

	const reset = () => {
		stop();
		setSeconds(0);
	};

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, []);

	return (
		<div>
			<p>Time: {seconds}s</p>
			<button onClick={start}>Start</button>
			<button onClick={stop}>Stop</button>
			<button onClick={reset}>Reset</button>
		</div>
	);
}
```

Notice how `intervalRef` stores the interval ID. We need this value to persist between renders, but we don't want changing it to cause a re-render - that would be wasteful!

## The Key Differences

Let's put them side-by-side:

| Feature                      | useState                         | useRef                                    |
| ---------------------------- | -------------------------------- | ----------------------------------------- |
| **Purpose**                  | Manage reactive state            | Store mutable values without re-rendering |
| **Returns**                  | `[value, setter]`                | `{ current: value }`                      |
| **Triggers re-render?**      | ✅ Yes                           | ❌ No                                     |
| **Mutability**               | Immutable (use setter)           | Mutable (change `.current` directly)      |
| **Persists across renders?** | ✅ Yes                           | ✅ Yes                                    |
| **Typical use cases**        | UI state, form data, API results | DOM access, timer IDs, previous values    |

## React Native: Same Concepts, Different Elements

The good news? Everything works the same way in React Native!

### useState in React Native

```javascript
import React, { useState } from "react";
import { View, Text, TextInput, Button } from "react-native";

function LoginForm() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	return (
		<View>
			<TextInput value={email} onChangeText={setEmail} placeholder="Email" />
			<TextInput
				value={password}
				onChangeText={setPassword}
				placeholder="Password"
				secureTextEntry
			/>
			<Button title="Login" onPress={() => console.log(email, password)} />
		</View>
	);
}
```

### useRef in React Native

In React Native, you use refs to access native component methods:

```javascript
import React, { useRef } from "react";
import { View, TextInput, Button } from "react-native";

function FocusableInput() {
	const inputRef = useRef(null);

	const focusInput = () => {
		inputRef.current?.focus(); // Call native focus method
	};

	return (
		<View>
			<TextInput ref={inputRef} placeholder="Type here" />
			<Button title="Focus Input" onPress={focusInput} />
		</View>
	);
}
```

Or with a ScrollView:

```javascript
import React, { useRef } from "react";
import { ScrollView, Button, View, Text } from "react-native";

function ScrollableContent() {
	const scrollRef = useRef(null);

	const scrollToBottom = () => {
		scrollRef.current?.scrollToEnd({ animated: true });
	};

	return (
		<View>
			<ScrollView ref={scrollRef}>
				{/* Your content here */}
				<Text>Lots of content...</Text>
			</ScrollView>
			<Button title="Scroll to Bottom" onPress={scrollToBottom} />
		</View>
	);
}
```

## When to Use Each

### Choose useState when:

- The value affects what users see
- You want automatic UI updates when data changes
- You're managing form inputs
- You're storing data from API calls
- You need toggle states (open/closed, visible/hidden)

### Choose useRef when:

- You need to access a DOM element or native component directly
- You're storing values that shouldn't trigger re-renders (like timer IDs)
- You want to track previous values of props or state
- You need a mutable value that persists across renders
- You're implementing imperative animations or measurements

## Common Pitfall: Using useRef When You Need useState

A mistake I see often:

```javascript
// ❌ Bad - This won't update the UI!
function BrokenCounter() {
	const countRef = useRef(0);

	const increment = () => {
		countRef.current += 1;
		console.log(countRef.current); // This logs correctly
		// But the UI won't update!
	};

	return (
		<div>
			<p>Count: {countRef.current}</p>
			<button onClick={increment}>Increment</button>
		</div>
	);
}

// ✅ Good - This updates the UI
function WorkingCounter() {
	const [count, setCount] = useState(0);

	return (
		<div>
			<p>Count: {count}</p>
			<button onClick={() => setCount(count + 1)}>Increment</button>
		</div>
	);
}
```

## Advanced Pattern: Combining Both

Sometimes you need both! Here's a real-world example - tracking whether a component has mounted:

```javascript
import React, { useState, useRef, useEffect } from "react";

function DataFetcher() {
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(false);
	const isMountedRef = useRef(true);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				const response = await fetch("https://api.example.com/data");
				const result = await response.json();

				// Only update state if component is still mounted
				if (isMountedRef.current) {
					setData(result);
				}
			} finally {
				if (isMountedRef.current) {
					setLoading(false);
				}
			}
		};

		fetchData();

		// Cleanup function
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	if (loading) return <div>Loading...</div>;
	return <div>Data: {JSON.stringify(data)}</div>;
}
```

Here, `isMountedRef` prevents state updates after unmounting (which causes warnings), while `data` and `loading` manage the UI.

## Performance Considerations

### useState Optimization

React is smart about re-renders, but you can optimize further:

```javascript
// Use functional updates when new state depends on old state
setCount((prevCount) => prevCount + 1);

// Use callback version of useState for expensive initialization
const [state, setState] = useState(() => {
	const initialState = someExpensiveComputation();
	return initialState;
});
```

### useRef Doesn't Need Optimization

Since `useRef` doesn't trigger re-renders, there's no performance concern with updating it frequently. That's actually one of its key benefits!

## Wrapping Up

The distinction between `useState` and `useRef` is fundamental to React:

- **`useState`** is for **reactive data** that affects your UI
- **`useRef`** is for **non-reactive data** and **direct element access**

Think of `useState` as your component's memory for things users see, and `useRef` as your component's memory for behind-the-scenes bookkeeping.

Once this clicks, you'll find yourself naturally reaching for the right hook without even thinking about it. And your components will be more efficient and easier to understand.

Now go forth and manage state like a pro! 🚀

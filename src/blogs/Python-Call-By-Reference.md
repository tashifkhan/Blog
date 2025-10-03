---
title: "Understanding Python's 'Call by Reference': Why It Doesn't Exist (And What Actually Happens)"
date: 2025-09-02
author: "Tashif Ahmad Khan"
socials:
  [
    "https://www.github.com/tashifkhan",
    "https://www.linkedin.com/in/tashif-ahmad-khan-982304244/",
    "https://tashif.codes",
  ]
tags: ["Python", "Low Level"]
excerpt: "Python doesn't have 'call by reference' in the traditional sense. Let's explore what really happens when you pass variables to functions and how to work with it effectively."
---

If you're coming to Python from languages like C++ or Java, you might be searching for Python's "call by reference" mechanism. Maybe you want to increment a counter in a function and have that change reflected outside. Here's the thing: **Python doesn't have call by reference** in the traditional sense.

But don't worry! Once you understand what Python actually does, you'll see it's both elegant and practical. Let's dive in.

## The Truth About Python Variables

First, we need to shift our mental model. In many languages, variables are like boxes that hold values. In Python, variables are more like **name tags** that point to objects in memory.

When you write:

```python
count = 5
```

You're not creating a box labeled "count" that contains the number 5. Instead, you're:

1. Creating an integer object with the value 5 somewhere in memory
2. Creating a name tag called "count" that points to that object

This distinction is crucial for understanding how function arguments work in Python.

## Pass by Assignment: Python's Actual Mechanism

Python uses something called "**pass by assignment**" or "**call by object reference**." Here's what happens when you pass an argument to a function:

1. The function parameter becomes a **new name** (label) in the function's local scope
2. This new name points to the **same object** as the original argument
3. Both names now refer to the same object in memory

Think of it like this: you're giving the object a second name tag, not making a copy of the object.

## The Immutability Catch: Why Integers Behave Differently

Let's see why you can't directly modify an integer in a function:

```python
def try_to_increment(count):
    print(f"Inside (before):  id={id(count)}, value={count}")
    count = count + 1  # This is the key line!
    print(f"Inside (after):   id={id(count)}, value={count}")

my_count = 5
print(f"Outside (initial): id={id(my_count)}, value={my_count}")

try_to_increment(my_count)

print(f"Outside (after):   id={id(my_count)}, value={my_count}")
```

**Output:**

```
Outside (initial): id=140707765997200, value=5
Inside (before):   id=140707765997200, value=5
Inside (after):    id=140707765997232, value=6
Outside (after):   id=140707765997200, value=5
```

Notice the `id` values (memory addresses). Here's what happened:

1. Initially, both `my_count` and `count` pointed to the same integer object `5` (same ID)
2. When we executed `count = count + 1`, Python:
   - Calculated `5 + 1 = 6`
   - Created a **new** integer object `6` (different ID!)
   - Made the local `count` name point to this new object
3. The original `my_count` still points to the original `5` object

**Why a new object?** Because integers in Python are **immutable** - they can't be changed after creation. You can't modify a 5 to become a 6; you can only create a new 6.

## Solution 1: Return the New Value (Most Pythonic)

The simplest and most Pythonic approach is to return the new value:

```python
def increment_count(current_count: int) -> int:
    """Increments a count and returns the new value."""
    return current_count + 1

def decrement_count(current_count: int) -> int:
    """Decrements a count and returns the new value."""
    return current_count - 1

my_count = 5
print(f"Initial: {my_count}")  # Output: Initial: 5

my_count = increment_count(my_count)
print(f"After increment: {my_count}")  # Output: After increment: 6

my_count = decrement_count(my_count)
print(f"After decrement: {my_count}")  # Output: After decrement: 5
```

This makes the data flow explicit and clear. It's the preferred approach for simple immutable values like integers, strings, or tuples.

## Solution 2: Use a Mutable Container

Since Python passes object references, if you pass a **mutable** object (one that can be modified in place), changes made inside the function will be visible outside. This is because both names point to the same mutable object.

### Using a List

```python
def increment_count_list(count_wrapper: list):
    """Increments the count inside a list wrapper."""
    count_wrapper[0] += 1

def decrement_count_list(count_wrapper: list):
    """Decrements the count inside a list wrapper."""
    count_wrapper[0] -= 1

my_count_list = [10]  # Wrap the count in a list
print(f"Initial: {my_count_list[0]}")  # Output: Initial: 10

increment_count_list(my_count_list)
print(f"After increment: {my_count_list[0]}")  # Output: After increment: 11

decrement_count_list(my_count_list)
print(f"After decrement: {my_count_list[0]}")  # Output: After decrement: 10
```

**Why this works:** Lists are mutable. Both `my_count_list` and `count_wrapper` point to the same list object. When we modify `count_wrapper[0]`, we're modifying the contents of that shared list, so the change is visible outside.

### Using a Dictionary

```python
def increment_count_dict(counter: dict):
    """Increments the count in a dictionary."""
    counter['value'] += 1

def decrement_count_dict(counter: dict):
    """Decrements the count in a dictionary."""
    counter['value'] -= 1

my_counter = {'value': 10}
print(f"Initial: {my_counter['value']}")  # Output: Initial: 10

increment_count_dict(my_counter)
print(f"After increment: {my_counter['value']}")  # Output: After increment: 11

decrement_count_dict(my_counter)
print(f"After decrement: {my_counter['value']}")  # Output: After decrement: 10
```

### Using a Custom Class

For more complex scenarios, a custom class often makes the most sense:

```python
class Counter:
    def __init__(self, initial_value: int = 0):
        self.value = initial_value

    def __str__(self):
        return f"Counter(value={self.value})"

def increment_counter(counter: Counter):
    """Increments a Counter object."""
    counter.value += 1

def decrement_counter(counter: Counter):
    """Decrements a Counter object."""
    counter.value -= 1

my_counter = Counter(10)
print(f"Initial: {my_counter}")  # Output: Initial: Counter(value=10)

increment_counter(my_counter)
print(f"After increment: {my_counter}")  # Output: After increment: Counter(value=11)

decrement_counter(my_counter)
print(f"After decrement: {my_counter}")  # Output: After decrement: Counter(value=10)
```

This approach is clean, readable, and makes your intent clear.

## Solution 3: Global Variables (Use Sparingly!)

You can use the `global` keyword to modify a global variable from within a function:

```python
count = 5

def increment_count_global():
    global count
    count += 1

def decrement_count_global():
    global count
    count -= 1

print(f"Initial: {count}")  # Output: Initial: 5

increment_count_global()
print(f"After increment: {count}")  # Output: After increment: 6

decrement_count_global()
print(f"After decrement: {count}")  # Output: After decrement: 5
```

**Warning:** Global variables can make code harder to understand, test, and debug. They create hidden dependencies between different parts of your code. Use this approach only when absolutely necessary.

## When to Use Which Approach?

Here's my guide for choosing the right pattern:

**Use return values when:**

- Working with simple, immutable values (integers, strings, tuples)
- The function's purpose is clearly to compute a new value
- You want explicit, easy-to-follow data flow

**Use mutable containers when:**

- You need to modify multiple values simultaneously
- The function is meant to update an existing state
- You're working with larger data structures that would be expensive to copy

**Use custom classes when:**

- You have related data and behavior that belong together
- You want clear, self-documenting code
- You need to encapsulate complex state

**Avoid global variables except when:**

- You truly need application-wide state (rare!)
- You're working with configuration that never changes
- You have no other choice (and document it heavily!)

## The Bigger Picture: Python's Philosophy

Python's approach might seem strange at first, but it aligns with the language's philosophy:

- **"Explicit is better than implicit"** - Returning values makes data flow obvious
- **"Simple is better than complex"** - No need to remember different parameter passing modes
- **"There should be one obvious way to do it"** - The pattern is consistent across all types

Once you internalize that everything in Python is an object reference and understand the mutable vs. immutable distinction, the behavior becomes intuitive and predictable.

## Quick Reference: Mutable vs. Immutable

**Immutable types** (can't be modified in place):

- int, float, complex
- str (strings)
- tuple
- frozenset
- bytes

**Mutable types** (can be modified in place):

- list
- dict
- set
- bytearray
- Custom classes (by default)

## Wrapping Up

Python doesn't have "call by reference" because it doesn't need it. The combination of pass-by-assignment with mutable and immutable types provides a clean, consistent model that works well once you understand it.

For your counter use case, I'd recommend:

- **Return the new value** for simple counters in straightforward functions
- **Use a custom class** if the counter is part of a larger state object
- **Use a list/dict wrapper** only if you need a quick solution and can't restructure the code

The key is understanding that you're not fighting against Python's design - you're working with it. And once it clicks, you'll find it's actually quite elegant.

Happy coding!

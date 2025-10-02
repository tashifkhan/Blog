---
title: "Creating N Nested Loops Programmatically in Python"
date: 2025-09-02
author: "Tashif Ahmad Khan"
socials:
  [
    "https://www.github.com/tashifkhan",
    "https://www.linkedin.com/in/tashif-ahmad-khan-982304244/",
    "https://tashif.codes",
  ]
tags: ["python", "algorithms", "recursion", "itertools", "programming"]
excerpt: "How do you create an arbitrary number of nested loops when you don't know the depth at compile time? Let's explore elegant solutions to this classic programming challenge."
---

Ever faced a problem where you need to generate all possible combinations of something, but the number of "levels" isn't known until runtime? Maybe you're building a product configurator, generating test cases, or exploring a search space. You need nested loops, but how many? That's determined by a variable `n`.

You can't write `for i in range(x): for j in range(x): for k in range(x):` because you don't know how many loops you'll need. This is where programmatic loop generation comes in - a classic computer science challenge with some elegant solutions.

Let's explore the best approaches, from the most intuitive to the most Pythonic.

## The Challenge

Imagine you want to generate all combinations of `n` numbers, where each number can be from 0 to some maximum value. For example:

- If `n=2` and `max=2`: `[0,0], [0,1], [1,0], [1,1]`
- If `n=3` and `max=2`: `[0,0,0], [0,0,1], [0,1,0]`, ... `[1,1,1]`

The total combinations will be `max^n`, which can grow quickly!

## Solution 1: Recursion (The Elegant Approach)

Recursion is perhaps the most intuitive way to think about nested loops. Each recursive call represents one level of nesting.

**The concept:**

- Each level of recursion handles one loop
- The base case is when we've reached depth `n` - we have a complete combination
- The recursive case iterates through possible values and calls itself for the next level

```python
def generate_nested_loops_recursive(
    n: int,
    max_val: int,
    current_level: int = 0,
    current_combination: list = None
):
    """
    Generates all combinations simulating n nested loops using recursion.

    Args:
        n: Number of nested loops (depth)
        max_val: Upper limit for each loop (exclusive)
        current_level: Current recursion depth (internal use)
        current_combination: Current path being built (internal use)
    """
    if current_combination is None:
        current_combination = []

    # Base case: we have a complete combination
    if current_level == n:
        print(f"Combination: {current_combination}")
        # In real use, you might yield this or pass to another function
        return

    # Recursive case: iterate for the current level
    for i in range(max_val):
        current_combination.append(i)  # Make a choice

        # Recurse to the next level
        generate_nested_loops_recursive(
            n, max_val, current_level + 1, current_combination
        )

        current_combination.pop()  # Backtrack for next iteration

# Example usage
print("Generating 3 nested loops, each from 0 to 1:")
generate_nested_loops_recursive(3, 2)
```

**Output:**

```
Generating 3 nested loops, each from 0 to 1:
Combination: [0, 0, 0]
Combination: [0, 0, 1]
Combination: [0, 1, 0]
Combination: [0, 1, 1]
Combination: [1, 0, 0]
Combination: [1, 0, 1]
Combination: [1, 1, 0]
Combination: [1, 1, 1]
```

**Pros:**

- **Intuitive and elegant** - the code structure mirrors the concept
- **Flexible** - easy to add conditions or modify behavior
- **Works for any depth** (within recursion limits)

**Cons:**

- **Stack overflow risk** - Python's default recursion limit is around 1000-3000
- **Slight overhead** from function calls (usually negligible)

## Solution 2: itertools.product (The Pythonic Way)

Python's `itertools` module is built for exactly this kind of problem. The `product()` function computes the Cartesian product of input iterables - which is exactly what nested loops do!

```python
import itertools

def generate_nested_loops_itertools(n: int, max_val: int):
    """
    Generates all combinations using itertools.product.

    Args:
        n: Number of nested loops (depth)
        max_val: Upper limit for each loop (exclusive)
    """
    single_loop_range = range(max_val)

    # product with repeat=n simulates n nested loops
    for combination in itertools.product(single_loop_range, repeat=n):
        print(f"Combination: {list(combination)}")

# Example usage
print("\nGenerating 3 nested loops using itertools.product:")
generate_nested_loops_itertools(3, 2)
```

**Output:**

```
Generating 3 nested loops using itertools.product:
Combination: [0, 0, 0]
Combination: [0, 0, 1]
Combination: [0, 1, 0]
Combination: [0, 1, 1]
Combination: [1, 0, 0]
Combination: [1, 0, 1]
Combination: [1, 1, 0]
Combination: [1, 1, 1]
```

**Pros:**

- **Concise and Pythonic** - just a few lines
- **Highly optimized** - implemented in C for speed
- **No recursion limits** - uses iteration internally
- **Memory efficient** - returns an iterator, not a list

**Cons:**

- **Python-specific** - other languages have equivalents but different APIs
- **Less direct control** - harder to add complex logic between levels

**This is my recommended approach for most use cases.** It's clean, fast, and idiomatic Python.

## Solution 3: Iterative with Manual State (The Low-Level Approach)

You can also simulate nested loops iteratively by maintaining a list of indices, similar to how an odometer works.

```python
def generate_nested_loops_iterative(n: int, max_val: int):
    """
    Generates all combinations using iterative index manipulation.

    Args:
        n: Number of nested loops (depth)
        max_val: Upper limit for each loop (exclusive)
    """
    if n == 0:
        return

    # Initialize all indices to 0
    indices = [0] * n

    while True:
        # Print current combination
        print(f"Combination: {indices.copy()}")

        # Increment the rightmost index (like an odometer)
        position = n - 1

        while position >= 0:
            indices[position] += 1

            if indices[position] < max_val:
                # No overflow, we're done incrementing
                break

            # Overflow: reset this position and carry to the left
            indices[position] = 0
            position -= 1

        # If we've carried past the leftmost position, we're done
        if position < 0:
            break

# Example usage
print("\nGenerating 3 nested loops using iterative approach:")
generate_nested_loops_iterative(3, 2)
```

**Output:**

```
Generating 3 nested loops using iterative approach:
Combination: [0, 0, 0]
Combination: [0, 0, 1]
Combination: [0, 1, 0]
Combination: [0, 1, 1]
Combination: [1, 0, 0]
Combination: [1, 0, 1]
Combination: [1, 1, 0]
Combination: [1, 1, 1]
```

**Pros:**

- **No recursion limits** - purely iterative
- **Full control** over state management
- **Language agnostic** - similar logic works in any language

**Cons:**

- **More complex** - harder to write correctly
- **Less readable** - the logic isn't immediately obvious
- **More error-prone** - easy to make off-by-one mistakes

## Real-World Example: Password Cracking Simulation

Let's say you want to generate all possible n-character passwords using a limited character set:

```python
import itertools

def generate_passwords(length: int, charset: str):
    """Generate all possible passwords of given length from charset."""
    count = 0
    for password_tuple in itertools.product(charset, repeat=length):
        password = ''.join(password_tuple)
        count += 1
        # In real use, you'd try this password
        if count <= 10:  # Just show first 10
            print(password)

    print(f"\nTotal passwords: {count}")

# Generate all 3-character passwords using digits
print("3-digit numeric passwords:")
generate_passwords(3, '0123456789')
```

**Output:**

```
3-digit numeric passwords:
000
001
002
003
004
005
006
007
008
009

Total passwords: 1000
```

## Performance Comparison

Let's benchmark the different approaches:

```python
import time
import itertools

def benchmark(n, max_val):
    # Recursion
    start = time.time()
    count = 0
    def recurse(level, combo):
        nonlocal count
        if level == n:
            count += 1
            return
        for i in range(max_val):
            recurse(level + 1, combo + [i])
    recurse(0, [])
    recursive_time = time.time() - start

    # itertools
    start = time.time()
    count = sum(1 for _ in itertools.product(range(max_val), repeat=n))
    itertools_time = time.time() - start

    print(f"\nn={n}, max_val={max_val} ({max_val**n} combinations)")
    print(f"Recursion: {recursive_time:.4f}s")
    print(f"itertools: {itertools_time:.4f}s")
    print(f"Speedup:   {recursive_time/itertools_time:.2f}x")

# Run benchmarks
benchmark(3, 10)
benchmark(4, 8)
benchmark(5, 6)
```

Typical results show `itertools.product` is 2-3x faster than recursion, thanks to its C implementation.

## When to Use Each Approach

**Use `itertools.product` when:**

- You're working in Python
- You want the fastest, most memory-efficient solution
- You need clean, maintainable code
- You're generating simple combinations

**Use recursion when:**

- You need complex logic between levels
- You want the most readable, self-explanatory code
- The depth is reasonably small (< 1000)
- You're building something educational

**Use iterative when:**

- You're in a language without good iterator libraries
- You need absolute control over the iteration
- You're hitting recursion limits
- Memory is extremely constrained

## Advanced: Varying Ranges Per Level

What if each "loop" needs a different range? `itertools.product` handles this beautifully:

```python
import itertools

# Different ranges for each position
colors = ['red', 'blue']
sizes = ['S', 'M', 'L']
materials = ['cotton', 'polyester']

# Generate all product variants
for variant in itertools.product(colors, sizes, materials):
    print(f"{variant[0]} {variant[1]} {variant[2]}")
```

**Output:**

```
red S cotton
red S polyester
red M cotton
red M polyester
...
blue L polyester
```

This is incredibly useful for e-commerce product variants, test case generation, or configuration exploration!

## Warning: Don't Use Dynamic Code Generation!

You might be tempted to use `exec()` to build loop code as a string. **Don't do it.** It's:

- Dangerous (security risk)
- Slow (interpreted at runtime)
- Unmaintainable (debugging nightmare)
- Completely unnecessary (we have better solutions!)

```python
# DON'T DO THIS!
code = "for i in range(2):\n"
code += "  for j in range(2):\n"
code += "    print([i, j])"
exec(code)  # Evil!
```

## Wrapping Up

Generating n nested loops programmatically is a classic problem with elegant solutions:

1. **For Python projects:** Use `itertools.product` - it's fast, clean, and Pythonic
2. **For educational purposes:** Use recursion - it's intuitive and teaches important concepts
3. **For low-level control:** Use iterative index manipulation - it's powerful but complex

The pattern you choose depends on your language, constraints, and use case. But in Python, `itertools.product` wins for most real-world scenarios.

Now go forth and generate those combinations! Just remember: with great power comes great computational complexity. A 10-level nested loop with 10 iterations each is 10 billion combinations. Choose your parameters wisely! 😄

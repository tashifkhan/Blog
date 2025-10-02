---
title: "Building a Pythonic Linked List: Mastering Dunder Methods"
date: 2025-08-20
author: "Tashif Ahmad Khan"
socials:
  [
    "https://www.github.com/tashifkhan",
    "https://www.linkedin.com/in/tashif-ahmad-khan-982304244/",
    "https://tashif.codes",
  ]
tags: ["python", "data structures", "dunder methods", "linked list", "oop"]
excerpt: "Learn how to build a fully functional linked list in Python using dunder methods. Make your custom data structure behave just like built-in Python sequences!"
---

Python's "dunder methods" (double underscore methods) are one of the language's most powerful features. They let your custom classes seamlessly integrate with Python's built-in operations - using `+` for concatenation, `len()` for size, `in` for membership testing, and much more.

Today, we're going to build a complete linked list implementation that feels as natural to use as Python's built-in list. By the end, you'll understand how to make your custom data structures truly Pythonic.

## What Are Dunder Methods?

Dunder methods (also called "magic methods" or "special methods") are methods with names like `__init__`, `__str__`, `__len__`. They have two leading and two trailing underscores.

Their superpower? They allow your objects to interact naturally with Python's built-in syntax:

```python
# Instead of this:
my_list.get_length()
my_list.add_to_front(item)
my_list.contains(item)

# You can write this:
len(my_list)
my_list.append(item)
item in my_list
```

## Why Build a Linked List?

Linked lists are fundamental data structures where elements are stored in nodes, each pointing to the next. Unlike arrays, they don't need contiguous memory, making insertions and deletions efficient at specific points.

But more importantly, building one from scratch with dunder methods teaches you how Python really works under the hood.

## The Node Class

Every linked list needs nodes:

```python
class Node:
    """
    Represents a single node in the linked list.
    Contains data and a reference to the next node.
    """
    def __init__(self, data):
        self.data = data
        self.next = None  # Points to the next node

    def __repr__(self):
        return f"Node({self.data})"
```

Simple, right? Now for the interesting part.

## Building the LinkedList Class

### Initialization with `__init__`

```python
class LinkedList:
    def __init__(self, initial_data=None):
        """
        Initialize an empty linked list.
        Optionally populate it from an iterable.
        """
        self.head = None  # First node
        self.tail = None  # Last node (for O(1) appends!)
        self.length = 0   # Track size for O(1) len()

        if initial_data:
            for item in initial_data:
                self.append(item)
```

Key design decisions:

- **`head`**: Always points to the first node
- **`tail`**: Points to the last node (makes appending O(1) instead of O(n))
- **`length`**: Cached size (makes `len()` O(1) instead of O(n))

### String Representation: `__str__` and `__repr__`

```python
def __str__(self):
    """
    User-friendly representation for print().
    """
    if not self.head:
        return "[]"

    nodes = []
    current = self.head
    while current:
        nodes.append(str(current.data))
        current = current.next
    return f"[{' -> '.join(nodes)}]"

def __repr__(self):
    """
    Developer-friendly representation for debugging.
    Should ideally be able to recreate the object.
    """
    if not self.head:
        return "LinkedList([])"

    items = []
    current = self.head
    while current:
        items.append(repr(current.data))
        current = current.next
    return f"LinkedList([{', '.join(items)}])"
```

Usage:

```python
my_list = LinkedList(['a', 'b', 'c'])
print(my_list)        # [a -> b -> c]
print(repr(my_list))  # LinkedList(['a', 'b', 'c'])
```

### Length with `__len__`

```python
def __len__(self):
    """
    Enable len(my_list) to work.
    O(1) because we cache the length!
    """
    return self.length
```

### Index Access: `__getitem__` and `__setitem__`

First, a helper method to traverse to any index:

```python
def _get_node(self, index):
    """
    Internal helper to get the node at a specific index.
    Handles negative indices like Python lists.
    """
    if not (-self.length <= index < self.length):
        raise IndexError("Linked list index out of range")

    if index < 0:
        index += self.length  # Convert negative to positive

    current = self.head
    for _ in range(index):
        current = current.next
    return current
```

Now implement indexing:

```python
def __getitem__(self, index):
    """
    Enable my_list[index] to retrieve items.
    """
    node = self._get_node(index)
    return node.data

def __setitem__(self, index, value):
    """
    Enable my_list[index] = value to set items.
    """
    node = self._get_node(index)
    node.data = value
```

Usage:

```python
my_list = LinkedList([10, 20, 30])
print(my_list[1])     # 20
print(my_list[-1])    # 30
my_list[0] = 15
print(my_list)        # [15 -> 20 -> 30]
```

### Deletion: `__delitem__`

```python
def __delitem__(self, index):
    """
    Enable del my_list[index] to delete items.
    Leverages our existing pop() method.
    """
    self.pop(index)
```

Usage:

```python
my_list = LinkedList(['a', 'b', 'c', 'd'])
del my_list[1]  # Removes 'b'
print(my_list)  # [a -> c -> d]
```

### Membership Testing: `__contains__`

```python
def __contains__(self, item):
    """
    Enable 'item in my_list' checks.
    """
    current = self.head
    while current:
        if current.data == item:
            return True
        current = current.next
    return False
```

Usage:

```python
my_list = LinkedList([1, 2, 3])
print(2 in my_list)     # True
print(99 in my_list)    # False
```

### Concatenation: `__add__`

```python
def __add__(self, other):
    """
    Enable my_list + other for concatenation.
    Returns a NEW list, leaving originals unchanged.
    """
    new_list = LinkedList()

    # Copy current list
    current = self.head
    while current:
        new_list.append(current.data)
        current = current.next

    # Add other list or iterable
    if isinstance(other, LinkedList):
        current = other.head
        while current:
            new_list.append(current.data)
            current = current.next
    elif hasattr(other, "__iter__"):
        for item in other:
            new_list.append(item)
    else:
        raise TypeError(f"Cannot concatenate LinkedList with {type(other)}")

    return new_list
```

Usage:

```python
list1 = LinkedList([1, 2])
list2 = LinkedList([3, 4])
list3 = list1 + list2
print(list3)  # [1 -> 2 -> 3 -> 4]
print(list1)  # [1 -> 2] (unchanged)
```

### The Iterator Protocol: `__iter__` and `__next__`

This is what makes `for item in my_list:` work!

We'll create a separate iterator class:

```python
class LinkedListIterator:
    """
    Iterator for LinkedList.
    Maintains iteration state.
    """
    def __init__(self, head_node):
        self._current = head_node

    def __iter__(self):
        """An iterator must return itself."""
        return self

    def __next__(self):
        """Return next item or raise StopIteration."""
        if self._current is None:
            raise StopIteration

        data = self._current.data
        self._current = self._current.next
        return data
```

Now update LinkedList:

```python
def __iter__(self):
    """
    Return a new iterator object.
    Each call creates a fresh iterator.
    """
    return LinkedListIterator(self.head)
```

Usage:

```python
my_list = LinkedList(['x', 'y', 'z'])

# For loop
for item in my_list:
    print(item)  # x, y, z

# List comprehension
squares = [x**2 for x in LinkedList([1, 2, 3])]

# Convert to Python list
py_list = list(my_list)

# Works with any function expecting an iterable
total = sum(LinkedList([10, 20, 30]))  # 60
```

### The Destructor: `__del__`

```python
def __del__(self):
    """
    Called when object is about to be destroyed.
    Timing is non-deterministic - not for resource cleanup!
    """
    # For demonstration only
    print(f"LinkedList object {id(self)} destroyed")

    # Python's GC handles node cleanup automatically
    # This is mainly for external resource cleanup (files, sockets, etc.)
```

**Important**: `__del__` timing is unpredictable. For predictable cleanup, use context managers (`with` statement).

## Essential Methods

Beyond dunder methods, we need core functionality:

### Append (O(1))

```python
def append(self, data):
    """Add element to the end."""
    new_node = Node(data)

    if not self.head:  # Empty list
        self.head = new_node
        self.tail = new_node
    else:
        self.tail.next = new_node
        self.tail = new_node

    self.length += 1
```

### Prepend (O(1))

```python
def prepend(self, data):
    """Add element to the beginning."""
    new_node = Node(data)

    if not self.head:
        self.head = new_node
        self.tail = new_node
    else:
        new_node.next = self.head
        self.head = new_node

    self.length += 1
```

### Insert (O(n))

```python
def insert(self, index, data):
    """Insert element at specific index."""
    if index < 0:
        if abs(index) > self.length:
            raise IndexError("Index out of range")
        index += self.length

    if index == 0:
        self.prepend(data)
    elif index >= self.length:
        self.append(data)
    else:
        new_node = Node(data)
        prev = self._get_node(index - 1)
        new_node.next = prev.next
        prev.next = new_node
        self.length += 1
```

### Remove (O(n))

```python
def remove(self, data):
    """Remove first occurrence of data."""
    if not self.head:
        raise ValueError(f"{data} not in list")

    # Removing head
    if self.head.data == data:
        if self.head == self.tail:
            self.head = None
            self.tail = None
        else:
            self.head = self.head.next
        self.length -= 1
        return

    # Removing other nodes
    current = self.head
    while current.next and current.next.data != data:
        current = current.next

    if current.next:
        if current.next == self.tail:
            self.tail = current
        current.next = current.next.next
        self.length -= 1
    else:
        raise ValueError(f"{data} not in list")
```

### Pop (O(n))

```python
def pop(self, index=-1):
    """Remove and return element at index."""
    if self.length == 0:
        raise IndexError("pop from empty list")

    if index < 0:
        index += self.length

    if not (0 <= index < self.length):
        raise IndexError("Index out of range")

    if index == 0:
        data = self.head.data
        if self.head == self.tail:
            self.head = None
            self.tail = None
        else:
            self.head = self.head.next
    else:
        prev = self._get_node(index - 1)
        data = prev.next.data
        if prev.next == self.tail:
            self.tail = prev
        prev.next = prev.next.next

    self.length -= 1
    return data
```

## Putting It All Together

Here's how naturally our LinkedList behaves:

```python
# Create from iterable
my_list = LinkedList([1, 2, 3, 4, 5])

# Length
print(len(my_list))  # 5

# Access
print(my_list[2])    # 3
my_list[2] = 10
print(my_list)       # [1 -> 2 -> 10 -> 4 -> 5]

# Membership
print(10 in my_list) # True

# Deletion
del my_list[2]
print(my_list)       # [1 -> 2 -> 4 -> 5]

# Iteration
for item in my_list:
    print(item)      # 1, 2, 4, 5

# Concatenation
other = LinkedList([6, 7])
combined = my_list + other
print(combined)      # [1 -> 2 -> 4 -> 5 -> 6 -> 7]

# Works with built-in functions
total = sum(my_list)        # 12
maximum = max(my_list)      # 5
py_list = list(my_list)     # [1, 2, 4, 5]

# Methods
my_list.append(99)
my_list.prepend(0)
my_list.insert(2, 1.5)
my_list.remove(4)
popped = my_list.pop()
```

## Performance Characteristics

| Operation             | Time Complexity |
| --------------------- | --------------- |
| `append()`            | O(1)            |
| `prepend()`           | O(1)            |
| `insert(index, item)` | O(n)            |
| `__getitem__[index]`  | O(n)            |
| `__setitem__[index]`  | O(n)            |
| `__delitem__[index]`  | O(n)            |
| `remove(item)`        | O(n)            |
| `pop(index)`          | O(n)            |
| `__contains__ (in)`   | O(n)            |
| `__len__`             | O(1)            |

## Best Practices for Dunder Methods

### 1. Follow Conventions

When you override `__add__`, it should truly represent addition or concatenation, not something unrelated.

### 2. Pair Related Methods

- Implement both `__str__` and `__repr__`
- If you have `__getitem__`, consider `__setitem__` and `__delitem__`
- If you have `__eq__`, consider `__ne__`, `__lt__`, etc.

### 3. Handle Edge Cases

```python
def __getitem__(self, index):
    # ✅ Good - handles negatives and bounds
    if not (-self.length <= index < self.length):
        raise IndexError("Index out of range")
    # ...
```

### 4. Return Appropriate Types

- `__str__` and `__repr__` must return strings
- `__len__` must return an integer
- `__iter__` must return an iterator

### 5. Don't Rely on `__del__`

Use context managers for predictable resource cleanup:

```python
class ResourceHolder:
    def __enter__(self):
        # Acquire resource
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        # Release resource (deterministic!)
        pass

with ResourceHolder() as holder:
    # Use resource
    pass  # Cleanup happens here, guaranteed
```

## Testing Your Implementation

```python
def test_linked_list():
    # Empty list
    ll = LinkedList()
    assert len(ll) == 0
    assert str(ll) == "[]"

    # Adding elements
    ll.append(1)
    ll.append(2)
    ll.prepend(0)
    assert list(ll) == [0, 1, 2]

    # Indexing
    assert ll[0] == 0
    assert ll[-1] == 2
    ll[1] = 10
    assert ll[1] == 10

    # Membership
    assert 10 in ll
    assert 99 not in ll

    # Deletion
    del ll[0]
    assert list(ll) == [10, 2]

    # Concatenation
    ll2 = LinkedList([3, 4])
    ll3 = ll + ll2
    assert list(ll3) == [10, 2, 3, 4]

    # Methods
    ll.insert(1, 1)
    assert list(ll) == [10, 1, 2]

    ll.remove(1)
    assert list(ll) == [10, 2]

    popped = ll.pop()
    assert popped == 2
    assert list(ll) == [10]

    print("All tests passed! ✅")

test_linked_list()
```

## What You've Learned

By building this linked list, you've mastered:

1. **Object initialization** with `__init__`
2. **String representation** with `__str__` and `__repr__`
3. **Container operations** with `__len__`, `__getitem__`, `__setitem__`, `__delitem__`
4. **Membership testing** with `__contains__`
5. **Operator overloading** with `__add__`
6. **Iterator protocol** with `__iter__` and `__next__`
7. **Destructor behavior** with `__del__`

## Wrapping Up

Dunder methods are what make Python feel magical. They let you create custom objects that behave naturally with Python's syntax, making your code more intuitive and Pythonic.

The patterns you've learned here apply to any custom data structure - trees, graphs, stacks, queues. Master these, and you'll write Python code that feels like it belongs in the standard library.

Now go build something amazing! 🐍✨

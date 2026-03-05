# react-skeletonix

[![npm version](https://img.shields.io/npm/v/react-skeletonix.svg?style=flat-square)](https://www.npmjs.com/package/react-skeletonix)
[![npm downloads](https://img.shields.io/npm/dm/react-skeletonix.svg?style=flat-square)](https://www.npmjs.com/package/react-skeletonix)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/react-skeletonix?style=flat-square)](https://bundlephobia.com/package/react-skeletonix)

**[👉 Full Documentation & Live Demo](https://doc.react-skeletonix.devpranali.com/)**

**The smartest React skeleton loader.** Automatically generates high-fidelity, high-contrast loading states from your existing child components with **zero configuration**.

## Why react-skeletonix?

Unlike traditional skeleton libraries that require you to manually design a separate "skeleton version" of your UI, `react-skeletonix` traverses your actual component tree and automatically creates a geometric mask that perfectly matches your layout.

- 🧠 **Automatic Shape Generation**: No more manual width/height definitions.
- ⚡ **Zero Configuration**: Just wrap your component and it "just works".
- 🎨 **Fully Customizable**: Adjust colors, duration, and animation variants (shimmer, pulse, wave).
- 📦 **Ultra Lightweight**: Zero dependencies (only peer-react).
- 🦾 **TypeScript First**: Full generic type support for `Skeleton<T>`.

## installation

```bash
npm install react-skeletonix
```

## Quick Start (Smart Rendering)

The most powerful way to use `react-skeletonix` is through **Function-as-Child (FaC)**. It allows you to define your UI once and let the library handle the injection of dummy data for a perfect "ghost" state.

### Simple Example
```tsx
import Skeleton from 'react-skeletonix';
import 'react-skeletonix/dist/style.css'; 

function Profile({ loading, user }) {
  return (
    <Skeleton loading={loading} data={{ name: 'Loading Name...', bio: 'Loading Bio...' }}>
      {(item) => (
        <div className="card">
          <h2>{item?.name || user?.name}</h2>
          <p>{item?.bio || user?.bio}</p>
        </div>
      )}
    </Skeleton>
  );
}
```

## TypeScript Support

`react-skeletonix` is built with TypeScript and provides full generic support for the `data` prop and render functions.

### Defining Types
```tsx
interface User {
  id: number;
  name: string;
  avatar: string;
}

// Pass the type to the Skeleton component
<Skeleton<User> 
  loading={loading} 
  data={{ id: 0, name: 'John Doe', avatar: '' }}
>
  {(item) => (
    <div>{item?.name}</div> // item is properly typed as User | null
  )}
</Skeleton>
```

## Animation Variants

Customize the "feel" of your loading states with different built-in animation variants.

| Variant | Description |
| :--- | :--- |
| `shimmer` (Default) | A smooth light sweep across the element. |
| `pulse` | Elements gently fade in and out. |
| `wave` | A flowing wave effect from left to right. |
| `blink` | A sharp on/off blinking animation. |
| `none` | Static grey placeholders with no animation. |

```tsx
<Skeleton loading={true} variant="pulse">
  <MyComponent />
</Skeleton>
```

## Advanced Examples

### 1. Complex Data Mapping
Simulate a list of complex objects with nested styling.

```tsx
<div className="grid">
  <Skeleton<Product> 
    loading={loading} 
    count={6} 
    variant="shimmer"
    data={[
      { id: 1, title: 'Premium Wireless Headphones', price: '$299.00', image: '' },
      { id: 2, title: 'Mechanical Gaming Keyboard', price: '$159.00', image: '' }
    ]}
  >
    {(item) => (
      <div className="product-card">
        <div className="image-placeholder" style={{ height: '200px' }} />
        <h3>{item?.title}</h3>
        <span className="price">{item?.price}</span>
        <button>Buy Now</button>
      </div>
    )}
  </Skeleton>
</div>
```

### 2. Using `showWrapper`
By default, the `Skeleton` wraps children in a helper `div` to apply masking. In some CSS Grid or Flex layouts, this wrapper might break your styles. Set `showWrapper={false}` to apply the skeleton classes directly to the first child element.

```tsx
<div className="flex-container">
  <Skeleton loading={loading} showWrapper={false}>
    <div className="flex-item">I am the direct child of the flex container</div>
  </Skeleton>
</div>
```

## Props & Parameters Explanation

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **`loading`** | `boolean` | **Required** | The main toggle. |
| **`data`** | `T` | `undefined` | Used with Function-as-Child to inject template data. |
| **`variant`** | `shimmer \| pulse \| wave \| blink \| none` | `shimmer` | The type of animation effect. |
| **`showWrapper`** | `boolean` | `true` | Whether to wrap children in a technical `div`. Set to `false` for direct style application. |
| **`count`** | `number` | `1` | Number of times to duplicate children while loading. |
| **`baseColor`** | `string` | `#f0f0f0` | Background color of skeleton shapes. |
| **`highlightColor`** | `string` | `#f8f8f8` | Color of the animated shimmer. |
| **`duration`** | `number` | `1.5` | Speed of animation in seconds. |
| **`circle`** | `boolean` | `false` | Forces circular shapes (100% border-radius). |
| **`excludeSelector`** | `string` | `undefined` | CSS selector to skip specific children. |

## FAQ

**Q: Do I need to specify the width and height of my skeletons?**  
A: No! `react-skeletonix` automatically assumes the exact geometric bounds of the children you wrap.

**Q: Why do I need to include the CSS file?**  
A: The CSS file provides essential layout utilities and high-performance animations.

## Performance notes

- **No Layout Thrashing:** The real DOM layout is preserved and simply "masked".
- **Hardware-Accelerated CSS:** Shimmer animations run solely via GPU-accelerated CSS.
- **Granular is Better:** For extremely complex pages, wrap modular groups rather than the entire app.

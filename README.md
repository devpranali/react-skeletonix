# react-skeletonix

A dynamic, zero-config React skeleton loader that automatically generates loading states directly from your UI components by masking them.

## Simple Quick Start

1. **Install the package:**

   ```bash
   npm install react-skeletonix
   ```
   *or*
   ```bash
   yarn add react-skeletonix
   ```

2. **Wrap your component:**

   ```tsx
   import Skeleton from 'react-skeletonix';
   import 'react-skeletonix/dist/style.css'; // Don't forget the styles!

   function Profile({ loading, user }) {
     return (
       <Skeleton loading={loading}>
         <div className="card">
           <img src={user?.avatar} alt="Avatar" className="avatar" />
           <h2>{user?.name || 'Loading Name...'}</h2>
           <p>{user?.bio || 'Loading Bio...'}</p>
         </div>
       </Skeleton>
     );
   }
   ```
   **That's it!** `react-skeletonix` will automatically mimic the layout of the wrapped DOM nodes while `loading` is `true`.

## Props & Parameters Explanation

Here is a detailed breakdown of all the parameters you can pass to the `<Skeleton>` component and what they do:

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **`loading`** | `boolean` | **Required** | The main toggle. When `true`, the skeleton animation is rendered over your components. When `false`, your actual child components render normally. |
| **`count`** | `number` | `1` | The number of times the child element should be duplicated while loading. This is incredibly useful for simulating a list of items using CSS Grid or Flexbox before you actually have the array of data. |
| **`baseColor`** | `string` | `#f0f0f0` | The background color of the skeleton shapes. Change this to match your app's background or dark mode theme. |
| **`highlightColor`** | `string` | `#f8f8f8` | The color of the animated shimmer effect that sweeps across the skeletons. |
| **`duration`** | `number` | `1.5` | The speed of the animation in seconds. Lower numbers (e.g., `1.0`) make the shimmer move faster, while higher numbers (e.g., `2.5`) make it move slower. |
| **`circle`** | `boolean` | `false` | When set to `true`, forces the generated skeleton shapes to have a 50% border radius (making squares look like circles). Useful for wrapping avatars or profile pictures explicitly. |
| **`data`** | `any` | `undefined` | Used with Function-as-Child (FaC). You can pass dummy data in here to satisfy typescript or structural requirements of your child component while loading. |
| **`excludeSelector`** | `string` | `undefined` | A CSS class or selector string. Any child node matching this selector will NOT be given a skeleton mask. |

## Examples

### 1. Using with Flexbox or CSS Grid
When building a responsive layout using flexbox or CSS grid, you can combine the `count` prop with your container to create a beautifully animated, repeating loading grid. As long as your parent container has `display: flex` or `display: grid`, the `<Skeleton>` component will spawn its cloned children perfectly into that layout.

```tsx
<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
  <Skeleton loading={loading} count={4}>
    {/* This card will be repeated 4 times side-by-side while loading */}
    <div className="flex-item-card" style={{ width: '250px' }}>
      <div className="thumbnail"></div>
      <h3>Product Title</h3>
      <p>Product Description goes here</p>
    </div>
  </Skeleton>
</div>
```

### 2. Customizing the Animation Effect
You can change the colors and speed of the loading animation. For instance, to create a fast, dark-mode skeleton:

```tsx
<Skeleton 
  loading={true} 
  baseColor="#2d3436" 
  highlightColor="#636e72" 
  duration={0.8} // Faster animation (0.8 seconds)
>
  <div className="dark-card">
    <p>Dark mode content here</p>
  </div>
</Skeleton>
```

### 3. Rendering as Circles
Force the skeleton effect to render as circles instead of rounded rectangles (useful for avatars).

```tsx
<Skeleton loading={loading} circle>
  <div className="avatar-wrapper">
    <img src={userImage} />
  </div>
</Skeleton>
```

### 4. Function as Child (Data Injection)
Provide fake data explicitly by using a render prop (Function-as-Child) and the `data` prop.

```tsx
<Skeleton loading={loading} count={3} data={{ id: 0, title: 'Loading...', desc: '...' }}>
  {(item) => (
    <div key={item.id} className="post">
      <h4>{item.title}</h4>
      <p>{item.desc}</p>
    </div>
  )}
</Skeleton>
```

## FAQ

**Q: Do I need to specify the width and height of my skeletons?**  
A: No! `react-skeletonix` automatically assumes the exact geometric bounds of the children you wrap.

**Q: Why do I need to include the CSS file?**  
A: The CSS file provides essential layout utilities, `pointer-events: none` attributes out of the box, and the high-performance gradient animations that drive the shimmer effect.

**Q: Does it replace my actual elements while loading?**  
A: No. It uses CSS pseudo-classes, masks, and pointer overlays. The underlying structural DOM is kept intact but visually obscured with a skeleton effect.

## Limitations explained

- **Content Sizing Necessity:** Skeletons only appear if the elements have calculated dimensions. An empty `<div>` without explicit CSS width/height might collapse to 0 height, which means the skeleton will have 0 height. Ensure you have placeholder text (`&nbsp;`) or dummy data during loading tests if you don't use the `data` prop.
- **Complex Third-Party Inputs:** Opaque libraries (like advanced interactive maps, canvas elements, or un-stylable iframes) may not get masked perfectly because `react-skeletonix` relies on traversing standard HTML nodes.
- **Background Images:** Masking elements that rely heavily on `min-height` and full-cover `background-image` properties can sometimes result in unintended rendering if they have no inner content.

## Performance notes included

- **No Layout Thrashing:** Because the real DOM layout is preserved and simply "masked" instead of fully swapping component trees (e.g., `<SkeletonNode />` vs `<RealNode />`), your browser calculates the layout once, which leads to fewer reflows.
- **Hardware-Accelerated CSS:** The shifting gradient used for the shimmer animation runs solely via hardware-accelerated CSS. React's main thread and JavaScript loop remain untouched and entirely free.
- **Granular is Better:** While `react-skeletonix` is very lightweight, spanning a single `<Skeleton>` component across thousands of deeply nested nodes *could* cause slight initial painting delays. For extremely complex pages, it is more performant to individually wrap modular groups of inputs/cards rather than your entire `<App />` component.

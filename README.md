# react-skeletonify

A zero-config React skeleton loader that automatically generates loading states from your existing UI components.

## Features
- **Zero Configuration:** Just wrap your content, no manual skeleton shapes needed.
- **Dynamic:** Automatically matches the exact layout of your components.
- **Lightweight:** Tiny footprint with pure CSS masking.
- **Repeatable:** Use the `count` prop to simulate lists.

## Installation

```bash
npm install react-skeletonify
```

## Usage

```jsx
import Skeleton from 'react-skeletonify';
import 'react-skeletonify/dist/style.css'; // Don't forget the styles!

function MyComponent({ loading, data }) {
  return (
    <Skeleton loading={loading} count={3}>
      <div className="card">
        <img src={data.image} alt="" />
        <h3>{data.title}</h3>
      </div>
    </Skeleton>
  );
}
```

## Advanced Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `loading` | `boolean` | **Required** | Toggles the skeleton mask |
| `count` | `number` | `1` | Number of times to repeat children while loading |
| `baseColor` | `string` | `#f0f0f0` | Base color of the shimmer |
| `highlightColor` | `string` | `#f8f8f8` | Shimmer highlight color |
| `duration` | `number` | `1.5` | Animation speed in seconds |
| `circle` | `boolean` | `false` | Force all children to be masked as circles |
| `excludeSelector` | `string` | `undefined` | CSS selector for items to keep hidden/visible during loading |

## Customization Examples

### Dark Mode
```jsx
<Skeleton loading={loading} baseColor="#2d3436" highlightColor="#636e72">
  <div className="dark-card">...</div>
</Skeleton>
```

### Avatars
```jsx
<Skeleton loading={loading} circle>
  <div className="avatar">JD</div>
</Skeleton>
```

### Excluding Icons
```jsx
<Skeleton loading={loading} excludeSelector=".no-skeleton">
  <div>
    <h3>Title</h3>
    <i className="no-skeleton icon-check" />
  </div>
</Skeleton>
```

## License
MIT

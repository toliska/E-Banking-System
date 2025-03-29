import React from 'react';

function HomePage() {
  return (
    <div className="bg-white">
      <section className="hero py-16 px-8 text-center bg-gray-100">
        <h1 className="text-4xl font-bold text-black">Plan. Organize. Celebrate.</h1>
        <button className="px-8 py-4 my-8 rounded bg-black text-white">Get Started</button>
      </section>
      <section className="features grid grid-cols-1 md:grid-cols-3 gap-8 px-8 pb-8">
        <div>
          <h2 className="text-xl font-bold text-black">Create Events</h2>
          <p className="my-4 text-gray-600">Create events with ease using our intuitive interface.</p>
        </div>
        <div>
          <h2 className="text-xl font-bold text-black">Track Expenses</h2>
          <p className="my-4 text-gray-600">Keep track of expenses and split them evenly among attendees.</p>
        </div>
        <div>
          <h2 className="text-xl font-bold text-black">Share Memories</h2>
          <p className="my-4 text-gray-600">Capture memories and reminiscences through photography and video recording.</p>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
// ```<file_sep>/docs/react/5_react_component_communication.md
// ---
// id: react_component_communication
// title: React Component Communication
// sidebar_label: React Component Communication
// description: React Component Communication
// slug: /react/react-component-communication
// ---

// There are several ways to communicate between components in a React application:

// 1. **Props**: Props (properties) are the primary way that parent components pass data to their child components. The child component can access the props passed to it via its `props` object.

// 2. **State**: State is used to store data that can change over time within a component. A component's state is private and can only be accessed by that component. To update the state, you use the `setState()` method provided by React.

// 3. **Context**: Context allows you to pass data through the component tree without having to pass props down manually at every level. You can create a context with `React.createContext()` and provide the context value at the top-level component using the `<MyContext.Provider>` component. The child components can access the context value by consuming it with the `useContext()` hook.

// 4. **Callbacks**: A callback function can be passed as a prop to a child component, allowing the parent component to communicate with the child component. The child component can invoke this callback function with data when needed. This is useful for one-way data flow between components.

// Here's an example of how we can use these techniques to communicate between components in React:

// ```jsx title="ParentComponent.js"
// import React, { useState } from "react";
// import ChildComponent from "./ChildComponent";

// function ParentComponent() {
//   const [state, setState] = useState(0);

//   function handleClick() {
//     setState(state + 1);
//   }

//   return (
//     <div>
//       <h1>Parent Component</h1>
//       <p>State: {state}</p>
//       <button onClick={handleClick}>Increment State</button>
//       <ChildComponent state={state} />
//     </div>
//   );
// }

// export default ParentComponent;

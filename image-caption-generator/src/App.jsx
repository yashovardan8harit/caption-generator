import { useState } from 'react'
import AppLayout from "./layouts/AppLayout";

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <AppLayout>
        <h1 className="text-2xl font-bold">Welcome to the Caption Generator</h1>
      </AppLayout>
    </>
  )
}

export default App

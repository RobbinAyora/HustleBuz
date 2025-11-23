import Login from "../components/Login";
import { Suspense } from "react";



export default function LoginRoute() {
  return (
    <main>
      <Suspense fallback={<div>Loading...</div>}>
        <Login />
        </Suspense>
   
    </main>
  );
}
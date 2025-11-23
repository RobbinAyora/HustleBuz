import Signup from "../components/Signup";
import { Suspense } from "react";




export default function SignupRoute() {
  return (
    <main>
         <Suspense fallback={<div>Loading...</div>}>
           <Signup />
         </Suspense>
     
    </main>
  );
}
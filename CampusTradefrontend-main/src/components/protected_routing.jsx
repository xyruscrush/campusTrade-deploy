import React, { useEffect,useState }  from "react";
import axios from 'axios';
export default function ProtectedRoute({children,fallback}){
const [autheticate,setauthenticate]=useState(null);
useEffect(()=>{
const vas=async()=>{
try{
    const response = await axios.post(
      "/api/check-refresh-token",
      {},
      { withCredentials: true }
    );

if(response.data.exists)setauthenticate(true);
else{
    setauthenticate(false);
}
}
catch(error){
    console.log("not autheticate");
    setauthenticate(false);
}
};
vas();
},[]);

return  autheticate?children:fallback;

}
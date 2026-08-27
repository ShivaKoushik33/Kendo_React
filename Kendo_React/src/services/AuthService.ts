import Api from "../services/Api";

export interface SignupData{
    mail:String,
    password:String
}

export interface LoginData {
    email: string;
    password: string;
}

export const signup=async(data:SignupData)=>{
    const response=await Api.post("/auth/signup",data);
    return response.data;
}

export const login=async(data:LoginData)=>{
    const response=await Api.post("/auth/login",data);
    const token=response.data.accessToken;
    localStorage.setItem("AccessToken",token);
    return response.data;
};

export const logout= async ()=>{
    try {
        await Api.post("/auth/logout");
    } finally {
        localStorage.removeItem("AccessToken");
    }
}
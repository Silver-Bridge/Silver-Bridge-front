import axios from "axios";
import{ API_BASE_URL } from "@env";

const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 8000,
})

export default client;
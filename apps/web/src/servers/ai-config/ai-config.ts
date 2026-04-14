import { ConfigProfile } from "@/types/interfaces/configProfile.interface";
import { IAiConfig } from "@ats-platform/types";
import axios from "axios";

const API_BASE_URL = process.env.API_BASE_URL;

async function getAllConfigs(): Promise<ConfigProfile[]> {
    const response = await axios.get(`${API_BASE_URL}/ai-config`);
    return response.data;
}

async function getConfigsById(id: string): Promise<ConfigProfile> {
    const response = await axios.get(`${API_BASE_URL}/ai-config/${id}`);
    return response.data;
}

async function createConfig(config: IAiConfig): Promise<ConfigProfile> {
    const response = await axios.post(`${API_BASE_URL}/ai-config`, config);
    return response.data;
}

async function updateConfig(id: string, config: IAiConfig): Promise<ConfigProfile> {
    const response = await axios.put(`${API_BASE_URL}/ai-config/${id}`, config);
    return response.data;
}

async function deleteConfig(id: string) {
    const response = await axios.delete(`${API_BASE_URL}/ai-config/${id}`);
    return response.data;
}

export {
    getAllConfigs,
    getConfigsById,
    createConfig,
    updateConfig,
    deleteConfig
}
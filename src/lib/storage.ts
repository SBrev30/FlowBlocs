import { Node, Edge } from 'reactflow';

const AUTH_TOKEN_KEY = 'notionAccessToken';
const CANVAS_STATE_KEY = 'canvasState';

export interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
}

// Web app storage using localStorage instead of chrome.storage
export const saveAuthToken = async (token: string): Promise<void> => {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving auth token:', error);
    throw error;
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const removeAuthToken = async (): Promise<void> => {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error removing auth token:', error);
    throw error;
  }
};

export const saveCanvasState = async (state: CanvasState): Promise<void> => {
  try {
    localStorage.setItem(CANVAS_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving canvas state:', error);
    throw error;
  }
};

export const getCanvasState = async (): Promise<CanvasState | null> => {
  try {
    const stateStr = localStorage.getItem(CANVAS_STATE_KEY);
    return stateStr ? JSON.parse(stateStr) : null;
  } catch (error) {
    console.error('Error getting canvas state:', error);
    return null;
  }
};

export const clearCanvasState = async (): Promise<void> => {
  try {
    localStorage.removeItem(CANVAS_STATE_KEY);
  } catch (error) {
    console.error('Error clearing canvas state:', error);
    throw error;
  }
};

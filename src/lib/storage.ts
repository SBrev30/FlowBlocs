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

export const saveAuthToken = async (token: string): Promise<void> => {
  try {
    await chrome.storage.sync.set({ [AUTH_TOKEN_KEY]: token });
  } catch (error) {
    console.error('Error saving auth token:', error);
    throw error;
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  try {
    const result = await chrome.storage.sync.get([AUTH_TOKEN_KEY]);
    return result[AUTH_TOKEN_KEY] || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const removeAuthToken = async (): Promise<void> => {
  try {
    await chrome.storage.sync.remove([AUTH_TOKEN_KEY]);
  } catch (error) {
    console.error('Error removing auth token:', error);
    throw error;
  }
};

export const saveCanvasState = async (state: CanvasState): Promise<void> => {
  try {
    await chrome.storage.local.set({ [CANVAS_STATE_KEY]: state });
  } catch (error) {
    console.error('Error saving canvas state:', error);
    throw error;
  }
};

export const getCanvasState = async (): Promise<CanvasState | null> => {
  try {
    const result = await chrome.storage.local.get([CANVAS_STATE_KEY]);
    return result[CANVAS_STATE_KEY] || null;
  } catch (error) {
    console.error('Error getting canvas state:', error);
    return null;
  }
};

export const clearCanvasState = async (): Promise<void> => {
  try {
    await chrome.storage.local.remove([CANVAS_STATE_KEY]);
  } catch (error) {
    console.error('Error clearing canvas state:', error);
    throw error;
  }
};

import ky, { HTTPError } from "ky";

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

interface ValidationError {
  code: string;
  message: string;
  path?: string[];
}

interface APIErrorResponse {
  success: boolean;
  error?: ValidationError[];
  data?: unknown;
}

const createInstance = (accessToken?: string) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // if (accessToken) {
  //   headers["Authorization"] = `Bearer ${accessToken}`;
  // }

  return ky.create({
    prefixUrl: process.env.NEXT_PUBLIC_API_URL,
    headers,
    hooks: {
      beforeError: [
        async (error: HTTPError) => {
          const { response } = error;

          try {
            const body = (await response.json()) as APIErrorResponse;
            console.log("API Error Response:", body);

            if (
              body.error &&
              Array.isArray(body.error) &&
              body.error.length > 0
            ) {
              throw new ApiError(body.error[0].message);
            }

            throw new ApiError("An unexpected error occurred");
          } catch (parseError) {
            if (parseError instanceof ApiError) {
              throw parseError;
            }
            throw new ApiError(response.statusText);
          }
        },
      ],
    },
  });
};

export const createApi = (accessToken?: string) => {
  // const instance = createInstance(accessToken);
  const instance = createInstance();

  return {
    get: async <T>(url: string): Promise<T> => {
      const cleanUrl = url.replace(/^\//, "");
      const response = await instance
        .get(cleanUrl)
        .json<{ success: boolean; data: T }>();
      return response.data;
    },

    post: async <T>(url: string, data?: unknown): Promise<T> => {
      const cleanUrl = url.replace(/^\//, "");
      const response = await instance
        .post(cleanUrl, { json: data })
        .json<{ success: boolean; data: T }>();
      return response.data;
    },

    put: async <T>(url: string, data?: unknown): Promise<T> => {
      const cleanUrl = url.replace(/^\//, "");
      const response = await instance
        .put(cleanUrl, { json: data })
        .json<{ success: boolean; data: T }>();
      return response.data;
    },

    delete: async <T>(url: string): Promise<T> => {
      const cleanUrl = url.replace(/^\//, "");
      const response = await instance
        .delete(cleanUrl)
        .json<{ success: boolean; data: T }>();
      return response.data;
    },
  };
};

export default createApi;

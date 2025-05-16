import { api } from "encore.dev/api";

// Interface for the home page response
interface HomeResponse {
  title: string;
  version: string;
  description: string;
  availableServices: string[];
}

// Home endpoint provides basic information about the management API
export const getHome = api(
  { expose: true, method: "GET", path: "/api" },
  async (): Promise<HomeResponse> => {
    return {
      title: "Management API",
      version: "1.0.0",
      description: "API for managing users, projects, and tasks",
      availableServices: ["auth", "users", "projects", "tasks"]
    };
  }
);
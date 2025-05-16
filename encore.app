{
  "id": "management-api-2zoi",
  "lang": "typescript",
  "services": {
    "auth": {},
    "users": {
      "dependencies": ["auth"]
    },
    "projects": {
      "dependencies": ["auth", "users"]
    },
    "tasks": {
      "dependencies": ["auth", "users", "projects"]
    },
    "url": {
      "dependencies": ["auth"]
    }
  }
}
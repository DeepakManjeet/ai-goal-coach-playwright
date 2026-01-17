export const testData = {
  users: {
    validUser: {
      username: 'testuser@example.com',
      password: 'Test123!',
      firstName: 'John',
      lastName: 'Doe'
    },
    invalidUser: {
      username: 'invalid@example.com',
      password: 'wrong123'
    }
  },
  urls: {
    baseUrl: 'https://example.com',
    loginPage: '/login',
    dashboard: '/dashboard'
  },
  searchQueries: {
    valid: ['playwright', 'automation', 'testing'],
    invalid: ['', '   ', '!@#$%^&*()']
  }
};

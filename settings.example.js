export default {
    accounts: [
        {
            email: 'account1@example.com',
            password: 'password1',
            // Any other options that `ChatGPTAPIBrowser` supports...
        },
        {
            email: 'account2@example.com',
            password: 'password2',
            proxyServer: 'user:pass@ip:port',
        },
        {
            email: 'account3@example.com',
            password: 'password3',
            proxyServer: 'ip:port',
            nopechaKey: 'accountNopechaKey',
        },
        // Add more accounts as needed...
    ],
    // The port the server will run on (optional, defaults to 3000)
    port: 3000,
    // Your NopeCHA API key. This will be applied to all accounts but can be overridden on a per-account basis.
    nopechaKey: 'nopechaKey',
}

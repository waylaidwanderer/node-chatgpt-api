module.exports = {
    accounts: [
        {
            email: 'account1@example.com',
            password: 'password1',
        },
        {
            email: 'account2@example.com',
            password: 'password2',
            proxy: 'user:pass@ip:port',
        },
        {
            email: 'account3@example.com',
            password: 'password3',
            proxy: 'ip:port',
        },
    ],
    port: 3000,
    nopechaKey: 'nopechaKey',
};

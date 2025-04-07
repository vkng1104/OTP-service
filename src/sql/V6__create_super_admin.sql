-- Create super admin user
INSERT INTO
    users (
        username,
        role,
        status,
        email,
        first_name,
        last_name
    )
VALUES
    (
        'super_admin',
        'super_admin',
        'active',
        'admin@thesis.com',
        'Super',
        'Admin'
    );

-- Create auth provider for the admin user
INSERT INTO
    auth_providers (
        user_id,
        provider,
        provider_id
    )
VALUES
    (
        (
            SELECT
                id
            FROM
                users
            WHERE
                username = 'super_admin'
        ), -- Get the admin user's ID
        'password',
        '$2b$10$zoqqxFguaDt4Pqnzx7qnLOk46JQpHV4/V/9USnSYLHqf.XThebxCu'
    );

-- Update the user's active_auth_provider_id
UPDATE users
SET
    active_auth_provider_id = (
        SELECT
            id
        FROM
            auth_providers
        WHERE
            provider_id = '$2b$10$zoqqxFguaDt4Pqnzx7qnLOk46JQpHV4/V/9USnSYLHqf.XThebxCu'
    )
WHERE
    username = 'super_admin';
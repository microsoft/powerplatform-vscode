# Power Pages Web API

The Power Pages Web API enables client-side JavaScript to perform CRUD operations on Dataverse tables.

## Setup Requirements

1. Enable Web API for the table in site settings
2. Configure table permissions for the authenticated web role

### Site Settings for Web API
- `Webapi/[table_name]/enabled` = `true`
- `Webapi/[table_name]/fields` = `*` or comma-separated field names

## API Endpoint
```
/_api/[table_plural_name]
```

Example: `/_api/contacts`, `/_api/accounts`

## Authentication
All Web API calls require the portal CSRF token:

```javascript
// Get CSRF token from shell
const token = shell.getTokenDeferred();

// Include in request headers
headers: {
    '__RequestVerificationToken': token
}
```

## Read Operations (GET)

### Get all records
```javascript
const response = await fetch('/_api/contacts', {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
});
const data = await response.json();
```

### Get single record by ID
```javascript
const response = await fetch('/_api/contacts(00000000-0000-0000-0000-000000000000)', {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
});
```

### Select specific columns
```javascript
const response = await fetch('/_api/contacts?$select=fullname,emailaddress1', {
    method: 'GET'
});
```

### Filter records
```javascript
// Simple filter
const response = await fetch("/_api/contacts?$filter=statecode eq 0", {
    method: 'GET'
});

// Multiple conditions
const response = await fetch("/_api/contacts?$filter=statecode eq 0 and contains(fullname,'John')", {
    method: 'GET'
});
```

### Order results
```javascript
const response = await fetch('/_api/contacts?$orderby=fullname asc', {
    method: 'GET'
});

// Multiple sort columns
const response = await fetch('/_api/contacts?$orderby=lastname asc,firstname asc', {
    method: 'GET'
});
```

### Pagination
```javascript
// Top N records
const response = await fetch('/_api/contacts?$top=10', {
    method: 'GET'
});

// Skip records
const response = await fetch('/_api/contacts?$top=10&$skip=20', {
    method: 'GET'
});
```

### Expand related records
```javascript
const response = await fetch('/_api/accounts?$expand=primarycontactid($select=fullname)', {
    method: 'GET'
});
```

## Create Operations (POST)

### Create a record
```javascript
const token = shell.getTokenDeferred();

const newContact = {
    firstname: 'John',
    lastname: 'Doe',
    emailaddress1: 'john.doe@example.com'
};

const response = await fetch('/_api/contacts', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        '__RequestVerificationToken': token
    },
    body: JSON.stringify(newContact)
});

if (response.ok) {
    const created = await response.json();
    console.log('Created contact ID:', created.contactid);
}
```

### Create with lookup reference
```javascript
const newContact = {
    firstname: 'Jane',
    lastname: 'Smith',
    'parentcustomerid_account@odata.bind': '/accounts(00000000-0000-0000-0000-000000000000)'
};
```

## Update Operations (PATCH)

### Update a record
```javascript
const token = shell.getTokenDeferred();

const updates = {
    emailaddress1: 'newemail@example.com',
    telephone1: '555-1234'
};

const response = await fetch('/_api/contacts(00000000-0000-0000-0000-000000000000)', {
    method: 'PATCH',
    headers: {
        'Content-Type': 'application/json',
        '__RequestVerificationToken': token
    },
    body: JSON.stringify(updates)
});

if (response.ok) {
    console.log('Contact updated successfully');
}
```

## Delete Operations (DELETE)

### Delete a record
```javascript
const token = shell.getTokenDeferred();

const response = await fetch('/_api/contacts(00000000-0000-0000-0000-000000000000)', {
    method: 'DELETE',
    headers: {
        '__RequestVerificationToken': token
    }
});

if (response.ok) {
    console.log('Contact deleted successfully');
}
```

## Error Handling

```javascript
try {
    const response = await fetch('/_api/contacts', {
        method: 'GET'
    });

    if (!response.ok) {
        const error = await response.json();
        console.error('Error:', error.error.message);
        return;
    }

    const data = await response.json();
    // Process data
} catch (error) {
    console.error('Network error:', error);
}
```

## Common Filter Operators

| Operator | Description | Example |
|----------|-------------|---------|
| eq | Equal | `$filter=statecode eq 0` |
| ne | Not equal | `$filter=statecode ne 1` |
| gt | Greater than | `$filter=revenue gt 1000000` |
| ge | Greater or equal | `$filter=createdon ge 2023-01-01` |
| lt | Less than | `$filter=revenue lt 500000` |
| le | Less or equal | `$filter=createdon le 2023-12-31` |
| contains | Contains string | `$filter=contains(fullname,'John')` |
| startswith | Starts with | `$filter=startswith(fullname,'J')` |
| endswith | Ends with | `$filter=endswith(emailaddress1,'.com')` |

## Complete Example: Contact Management

```javascript
class ContactService {
    constructor() {
        this.baseUrl = '/_api/contacts';
    }

    async getToken() {
        return shell.getTokenDeferred();
    }

    async getContacts(filter = '') {
        let url = this.baseUrl + '?$select=fullname,emailaddress1,telephone1';
        if (filter) {
            url += '&$filter=' + encodeURIComponent(filter);
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch contacts');
        return response.json();
    }

    async createContact(contact) {
        const token = await this.getToken();
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                '__RequestVerificationToken': token
            },
            body: JSON.stringify(contact)
        });

        if (!response.ok) throw new Error('Failed to create contact');
        return response.json();
    }

    async updateContact(id, updates) {
        const token = await this.getToken();
        const response = await fetch(`${this.baseUrl}(${id})`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                '__RequestVerificationToken': token
            },
            body: JSON.stringify(updates)
        });

        if (!response.ok) throw new Error('Failed to update contact');
        return true;
    }

    async deleteContact(id) {
        const token = await this.getToken();
        const response = await fetch(`${this.baseUrl}(${id})`, {
            method: 'DELETE',
            headers: {
                '__RequestVerificationToken': token
            }
        });

        if (!response.ok) throw new Error('Failed to delete contact');
        return true;
    }
}
```

# Power Pages JavaScript API

Power Pages provides client-side JavaScript APIs for interacting with forms, lists, and site functionality.

## Global Objects

### shell
The `shell` object provides core site functionality:

```javascript
// Get CSRF token for API calls
const token = shell.getTokenDeferred();

// Get current user info
const user = shell.user;
console.log(user.id);
console.log(user.name);

// Check if user is authenticated
if (shell.isAuthenticated()) {
    // User is signed in
}
```

### Portal User Object
```javascript
// Access current user properties
const user = shell.user;

user.id          // User's contact ID
user.name        // Display name
user.email       // Email address
user.roles       // Array of web roles
```

## Form APIs

### Getting Form Reference
```javascript
// Basic form
const form = document.getElementById('EntityFormControl');

// Multistep form (webform)
const webform = document.getElementById('WebFormControl');
```

### Field Operations

```javascript
// Get field value
const value = $('#fieldname').val();

// Set field value
$('#fieldname').val('new value');

// Get/Set for different field types
// Text field
$('#name').val();

// Option set (dropdown)
$('#statuscode').val(); // Returns selected value
$('#statuscode option:selected').text(); // Returns selected text

// Two option (boolean)
$('#isprimary').prop('checked'); // Returns true/false

// Date field
$('#birthdate').val(); // Returns date string

// Lookup field
$('#parentcustomerid').val(); // Returns GUID
$('#parentcustomerid_name').val(); // Returns display name
```

### Field Visibility

```javascript
// Hide field
$('#fieldname').closest('.control-group').hide();
$('#fieldname').closest('tr').hide(); // For table layout

// Show field
$('#fieldname').closest('.control-group').show();
$('#fieldname').closest('tr').show();

// Toggle based on condition
function toggleField(fieldName, show) {
    const container = $('#' + fieldName).closest('.control-group');
    if (show) {
        container.show();
    } else {
        container.hide();
    }
}
```

### Field State

```javascript
// Disable field
$('#fieldname').prop('disabled', true);

// Enable field
$('#fieldname').prop('disabled', false);

// Make field read-only
$('#fieldname').prop('readonly', true);

// Make field required
$('#fieldname').prop('required', true);
$('#fieldname').closest('.control-group').addClass('required');

// Remove required
$('#fieldname').prop('required', false);
$('#fieldname').closest('.control-group').removeClass('required');
```

## Form Validation

### Built-in Validation
```javascript
// Check if form is valid
function isFormValid() {
    if (typeof Page_ClientValidate === 'function') {
        return Page_ClientValidate();
    }
    return true;
}

// Validate before submit
$('#InsertButton, #UpdateButton').click(function(e) {
    if (!isFormValid()) {
        e.preventDefault();
        return false;
    }
});
```

### Custom Validation

```javascript
// Add custom validator
function addCustomValidator(fieldId, validationFunction, errorMessage) {
    const field = document.getElementById(fieldId);

    $(field).on('blur', function() {
        const isValid = validationFunction($(this).val());

        if (!isValid) {
            showValidationError(fieldId, errorMessage);
        } else {
            clearValidationError(fieldId);
        }
    });
}

function showValidationError(fieldId, message) {
    const field = $('#' + fieldId);
    field.closest('.control-group').addClass('has-error');

    // Add error message if not exists
    if (field.siblings('.validation-error').length === 0) {
        field.after('<span class="validation-error text-danger">' + message + '</span>');
    }
}

function clearValidationError(fieldId) {
    const field = $('#' + fieldId);
    field.closest('.control-group').removeClass('has-error');
    field.siblings('.validation-error').remove();
}

// Usage
addCustomValidator('emailaddress1',
    function(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    },
    'Please enter a valid email address'
);
```

## Lookup Field APIs

### Setting Lookup Values
```javascript
function setLookupValue(fieldName, id, name, entityType) {
    $('#' + fieldName).val(id);
    $('#' + fieldName + '_name').val(name);
    $('#' + fieldName + '_entityname').val(entityType);
}

// Usage
setLookupValue('parentcustomerid',
    '00000000-0000-0000-0000-000000000000',
    'Contoso Ltd',
    'account'
);
```

### Getting Lookup Values
```javascript
function getLookupValue(fieldName) {
    return {
        id: $('#' + fieldName).val(),
        name: $('#' + fieldName + '_name').val(),
        entityType: $('#' + fieldName + '_entityname').val()
    };
}

// Usage
const parent = getLookupValue('parentcustomerid');
console.log(parent.name); // "Contoso Ltd"
```

### Clearing Lookup
```javascript
function clearLookup(fieldName) {
    $('#' + fieldName).val('');
    $('#' + fieldName + '_name').val('');
    $('#' + fieldName + '_entityname').val('');
}
```

## Event Handling

### Form Events
```javascript
// Document ready
$(document).ready(function() {
    // Initialize form customizations
});

// Before form submit
$('form').on('submit', function(e) {
    // Pre-submit logic
    if (!customValidation()) {
        e.preventDefault();
        return false;
    }
});

// Field change
$('#fieldname').on('change', function() {
    console.log('Field changed to:', $(this).val());
});

// Field focus/blur
$('#fieldname').on('focus', function() {
    // Field received focus
});

$('#fieldname').on('blur', function() {
    // Field lost focus
});
```

### List Events
```javascript
// List loaded
$(document).on('entitylist.loaded', function(e, data) {
    console.log('Records loaded:', data.records.length);
});

// Row clicked
$(document).on('entitylist.rowclick', function(e, data) {
    console.log('Row clicked:', data.id);
});

// Page changed
$(document).on('entitylist.pagechange', function(e, data) {
    console.log('Page:', data.page);
});
```

### Webform Events
```javascript
// Step loaded
$(document).on('webform.stepload', function(e, data) {
    console.log('Step:', data.stepName);
});

// Before next step
$(document).on('webform.nextstep', function(e, data) {
    // Validate before proceeding
});

// Before previous step
$(document).on('webform.previousstep', function(e, data) {
    // Handle going back
});
```

## AJAX/Fetch Patterns

### Fetching Data
```javascript
// Using fetch API
async function fetchRecords(tableName) {
    try {
        const response = await fetch(`/_api/${tableName}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching records:', error);
        throw error;
    }
}
```

### Creating Records
```javascript
async function createRecord(tableName, data) {
    const token = shell.getTokenDeferred();

    const response = await fetch(`/_api/${tableName}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            '__RequestVerificationToken': token
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error.message);
    }

    return await response.json();
}
```

## Utility Functions

### Show/Hide Loading
```javascript
function showLoading(message = 'Loading...') {
    if (!$('#loadingOverlay').length) {
        $('body').append(`
            <div id="loadingOverlay" class="loading-overlay">
                <div class="loading-content">
                    <div class="spinner"></div>
                    <p class="loading-message">${message}</p>
                </div>
            </div>
        `);
    }
    $('#loadingOverlay').show();
}

function hideLoading() {
    $('#loadingOverlay').hide();
}
```

### Show Notification
```javascript
function showNotification(message, type = 'info') {
    const notification = $(`
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="close" data-dismiss="alert">
                <span>&times;</span>
            </button>
        </div>
    `);

    $('#notification-area').prepend(notification);

    // Auto-dismiss after 5 seconds
    setTimeout(function() {
        notification.alert('close');
    }, 5000);
}

// Usage
showNotification('Record saved successfully!', 'success');
showNotification('Please check your input.', 'warning');
showNotification('An error occurred.', 'danger');
```

### Format Functions
```javascript
// Format date
function formatDate(date, format = 'MM/DD/YYYY') {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();

    return format
        .replace('MM', month)
        .replace('DD', day)
        .replace('YYYY', year);
}

// Format currency
function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

// Format number
function formatNumber(number, decimals = 2) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(number);
}
```

## Best Practices

### Namespace Your Code
```javascript
// Create namespace to avoid conflicts
var MyPortal = MyPortal || {};

MyPortal.Forms = {
    init: function() {
        this.bindEvents();
        this.setDefaultValues();
    },

    bindEvents: function() {
        $('#status').on('change', this.onStatusChange.bind(this));
    },

    setDefaultValues: function() {
        // Set defaults
    },

    onStatusChange: function(e) {
        // Handle status change
    }
};

$(document).ready(function() {
    MyPortal.Forms.init();
});
```

### Error Handling
```javascript
// Global error handler
window.onerror = function(message, source, lineno, colno, error) {
    console.error('Global error:', {
        message: message,
        source: source,
        line: lineno,
        column: colno,
        error: error
    });

    // Optionally log to server
    // logErrorToServer(error);

    return false;
};

// Promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
});
```

### Performance Tips
```javascript
// Cache DOM selections
const $form = $('#EntityFormControl');
const $fields = {
    name: $('#name'),
    email: $('#emailaddress1'),
    phone: $('#telephone1')
};

// Use event delegation for dynamic content
$(document).on('click', '.dynamic-button', function() {
    // Handle click
});

// Debounce frequent events
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

$('#searchInput').on('input', debounce(function() {
    performSearch($(this).val());
}, 300));
```

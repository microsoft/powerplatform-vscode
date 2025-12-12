# Power Pages Lists (Entity Lists)

Lists (formerly entity lists) display Dataverse records in a tabular format on Power Pages sites.

## Creating a List

Lists are configured in the Portal Management app or Power Pages design studio:
1. Create a view in the Dataverse table
2. Create a List record linking to that view
3. Add the list to a webpage

## Liquid Tag Usage

### Basic List Tag
```liquid
{% entitylist name: 'Active Contacts' %}
```

### With List ID
```liquid
{% entitylist id: '00000000-0000-0000-0000-000000000000' %}
```

## Configuration Options

### Basic Settings
- **Name**: Unique identifier for the list
- **Table Name**: Dataverse table to display
- **Views**: One or more Dataverse views to show
- **Page Size**: Records per page
- **Web Page for Details View**: Page to view record details
- **Web Page for Create**: Page with form for creating records

### View Selection
Allow users to switch between multiple views:
```liquid
{% entitylist name: 'Contacts' %}
    <!-- View selector automatically rendered if multiple views configured -->
{% endentitylist %}
```

## List Actions

### Built-in Actions
| Action | Description |
|--------|-------------|
| Create | Open create form |
| View Details | Navigate to details page |
| Edit | Open edit form |
| Delete | Delete record |
| Download | Export to Excel |

### Configure Actions in Metadata
```
Create Button Label: "Add New Contact"
Details Button Label: "View"
Edit Button Label: "Edit"
Delete Button Label: "Remove"
```

## List Filtering

### OData Filter
Apply filters programmatically:
```javascript
// Filter list by status
function filterByStatus(status) {
    const listId = 'EntityListControl';
    const filter = `statecode eq ${status}`;

    // Apply filter
    $(document).trigger('entitylist.filter', {
        id: listId,
        filter: filter
    });
}
```

### Search Configuration
Enable search on specific columns:
- Configure searchable columns in list settings
- Search box appears automatically

```liquid
{% entitylist name: 'Searchable Contacts' %}
    <!-- Search input is automatically rendered -->
{% endentitylist %}
```

### Filter Dropdown
Configure dropdown filters based on option sets or lookups:
```liquid
{% entitylist name: 'Filterable List' %}
    <select id="statusFilter" onchange="applyFilter()">
        <option value="">All Status</option>
        <option value="0">Active</option>
        <option value="1">Inactive</option>
    </select>
{% endentitylist %}

<script>
function applyFilter() {
    const status = document.getElementById('statusFilter').value;
    // Apply the filter to the list
}
</script>
```

## JavaScript Integration

### List Events

```javascript
// List loaded event
$(document).on('entitylist.loaded', function(e, data) {
    console.log('List loaded with', data.records.length, 'records');
});

// Record selected event
$(document).on('entitylist.rowclick', function(e, data) {
    console.log('Selected record:', data.id);
});

// Before delete event
$(document).on('entitylist.beforedelete', function(e, data) {
    if (!confirm('Are you sure you want to delete this record?')) {
        e.preventDefault();
    }
});
```

### Customizing List Rendering

```javascript
// After list renders
$(document).ready(function() {
    // Add custom column formatting
    $('.entitylist table tbody tr').each(function() {
        const status = $(this).find('td[data-attribute="statecode"]').text();
        if (status === 'Active') {
            $(this).addClass('status-active');
        }
    });
});
```

### Row Actions

```javascript
// Add custom row action
$(document).on('entitylist.loaded', function() {
    $('.entitylist table tbody tr').each(function() {
        const recordId = $(this).data('id');
        const actionCell = $(this).find('.action-cell');

        actionCell.append(`
            <button onclick="customAction('${recordId}')" class="btn btn-info">
                Custom Action
            </button>
        `);
    });
});

function customAction(recordId) {
    // Perform custom action with record ID
    console.log('Custom action for:', recordId);
}
```

## Pagination

Lists automatically include pagination when records exceed page size.

### Customizing Pagination
```javascript
// Handle page change
$(document).on('entitylist.pagechange', function(e, data) {
    console.log('Changed to page:', data.page);
});

// Programmatic page navigation
function goToPage(pageNumber) {
    $(document).trigger('entitylist.navigate', { page: pageNumber });
}
```

## Sorting

### Enable Column Sorting
Sorting is configured per column in list metadata.

```javascript
// Handle sort change
$(document).on('entitylist.sort', function(e, data) {
    console.log('Sorted by:', data.column, data.direction);
});

// Programmatic sorting
function sortByColumn(column, direction) {
    $(document).trigger('entitylist.sort', {
        column: column,
        direction: direction // 'asc' or 'desc'
    });
}
```

## Export to Excel

Enable download action in list configuration:

```javascript
// Trigger export programmatically
function exportToExcel() {
    $('.entitylist .download-link').click();
}
```

## Map View

Lists can display records on a map using latitude/longitude fields:

### Configuration
- Enable Map View in list settings
- Specify latitude and longitude fields
- Configure map zoom and center

```liquid
{% entitylist name: 'Locations Map View' %}
    <!-- Map renders automatically when configured -->
{% endentitylist %}
```

## Calendar View

Display records in a calendar format:

### Configuration
- Enable Calendar View in list settings
- Specify start date and end date fields
- Configure calendar options

## Customizing List Appearance

### CSS Customization
```css
/* Style list table */
.entitylist table {
    width: 100%;
    border-collapse: collapse;
}

.entitylist table th {
    background-color: #f5f5f5;
    padding: 12px;
    text-align: left;
}

.entitylist table td {
    padding: 10px;
    border-bottom: 1px solid #ddd;
}

/* Hover effect */
.entitylist table tbody tr:hover {
    background-color: #f9f9f9;
}

/* Status-based styling */
.entitylist table tr.status-active {
    border-left: 3px solid green;
}

.entitylist table tr.status-inactive {
    border-left: 3px solid red;
}
```

### Custom Column Templates

Using Liquid in list templates:
```liquid
{% if columnname == 'emailaddress1' %}
    <a href="mailto:{{ value }}">{{ value }}</a>
{% elsif columnname == 'statuscode' %}
    <span class="badge badge-{{ value | downcase }}">{{ value }}</span>
{% else %}
    {{ value }}
{% endif %}
```

## List with Details Pattern

### List Page
```liquid
<h2>Contacts</h2>
{% entitylist name: 'Active Contacts' %}

<script>
$(document).on('entitylist.rowclick', function(e, data) {
    window.location.href = '/contact-details?id=' + data.id;
});
</script>
```

### Details Page
```liquid
{% assign contactId = request.params['id'] %}
{% fetchxml contact %}
<fetch>
    <entity name="contact">
        <attribute name="fullname" />
        <attribute name="emailaddress1" />
        <attribute name="telephone1" />
        <filter>
            <condition attribute="contactid" operator="eq" value="{{ contactId }}" />
        </filter>
    </entity>
</fetch>
{% endfetchxml %}

{% if contact.results.entities.size > 0 %}
    {% assign c = contact.results.entities[0] %}
    <h2>{{ c.fullname }}</h2>
    <p>Email: {{ c.emailaddress1 }}</p>
    <p>Phone: {{ c.telephone1 }}</p>
{% else %}
    <p>Contact not found.</p>
{% endif %}
```

## Common Patterns

### Filtered List by Current User
```liquid
{% if user %}
    {% entitylist name: 'My Records' %}

    <script>
    $(document).ready(function() {
        // Filter to show only current user's records
        $(document).trigger('entitylist.filter', {
            filter: "ownerid eq '{{ user.id }}'"
        });
    });
    </script>
{% else %}
    <p>Please sign in to view your records.</p>
{% endif %}
```

### Master-Detail List
```liquid
<div class="row">
    <div class="col-md-4">
        {% entitylist name: 'Categories' %}
    </div>
    <div class="col-md-8" id="details-panel">
        <p>Select a category to view details.</p>
    </div>
</div>

<script>
$(document).on('entitylist.rowclick', function(e, data) {
    e.preventDefault();

    // Load details via AJAX
    $.get('/api/category/' + data.id, function(details) {
        $('#details-panel').html(details);
    });
});
</script>
```

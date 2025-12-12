# Power Pages Basic Forms (Entity Forms)

Basic forms (formerly entity forms) allow users to create, view, or edit Dataverse records on Power Pages sites.

## Creating a Basic Form

Basic forms are configured in the Portal Management app or Power Pages design studio:
1. Create a model-driven form in the table's Forms section
2. Create a Basic Form record linking to that form
3. Add the basic form to a webpage

## Liquid Tag Usage

### Basic Form Tag
```liquid
{% entityform name: 'Contact Us Form' %}
```

### With Form ID
```liquid
{% entityform id: '00000000-0000-0000-0000-000000000000' %}
```

## Form Modes

| Mode | Description |
|------|-------------|
| Insert | Create new records |
| Edit | Edit existing records |
| ReadOnly | Display records without editing |

## Form Configuration Options

### Basic Settings
- **Name**: Unique identifier for the form
- **Table Name**: Dataverse table the form is based on
- **Form Name**: Model-driven form to render
- **Tab Name**: Specific tab to render (optional)
- **Mode**: Insert, Edit, or ReadOnly

### Success Actions
- Display success message
- Redirect to webpage
- Redirect to URL

### On Success Settings
```
Success Message: "Thank you for your submission!"
Redirect URL: /thank-you
Redirect Web Page: Thank You Page
Append Record ID: true/false
```

## Form Metadata

Form metadata controls field behavior without modifying the model-driven form.

### Field Behavior Options
- **Label**: Override field label
- **Default Value**: Pre-populate field values
- **CSS Class**: Add custom CSS classes
- **Validation**: Add custom validation rules
- **Read-Only**: Make field read-only
- **Required**: Make field required

### Setting Default Values

Using Liquid:
```liquid
{% entityform name: 'Contact Form' %}
{% assign form.fields['emailaddress1'].value = user.emailaddress1 %}
{% endentityform %}
```

Using Query String:
```
/contact-form?emailaddress1=user@example.com
```

## JavaScript Integration

### Form Events

```javascript
// Form load event
$(document).ready(function() {
    // Form is ready
    const form = document.getElementById('EntityFormControl');
});

// Before form submit
if (typeof(Page_ClientValidate) === 'function') {
    // Custom validation before submit
}
```

### Field Manipulation

```javascript
// Get field value
const email = $('#emailaddress1').val();

// Set field value
$('#firstname').val('John');

// Hide/Show field
$('#telephone1').closest('tr').hide();
$('#telephone1').closest('tr').show();

// Enable/Disable field
$('#emailaddress1').prop('disabled', true);
$('#emailaddress1').prop('disabled', false);

// Make field required
$('#lastname').attr('required', 'required');
```

### Field Validation

Field validations are used to customize the validation of fields on the form. Here is an example JavaScript code that validates that the user has specified an email address.

```JavaScript
if (window.jQuery) {
   (function ($) {
      $(document).ready(function () {
         if (typeof (Page_Validators) == 'undefined') return;
         // Create new validator
         var newValidator = document.createElement('span');
         newValidator.style.display = ""none"";
         newValidator.id = ""emailaddress1Validator"";
         newValidator.controltovalidate = ""emailaddress1"";
         newValidator.errormessage = ""Email is a required field."";
         newValidator.validationGroup = """"; // Set this if you have set ValidationGroup on the form
         newValidator.initialvalue = """";
         newValidator.evaluationfunction = function () {
            // check if email address is empty
            var value = $(""#emailaddress1"").val();
            if (value == null || value == """") {
            return false;
            } else {
               return true;
            }
         };

         // Add the new validator to the page validators array:
         Page_Validators.push(newValidator);

      });
   }(window.jQuery));
}
```

> [!NOTE]
> Refine the provided code snippet, which serves as an illustrative example for implementing form field validation. The developer's request specifies the table name as - {{targetEntity}}  and includes associated field information in the format {label:columnName:controlType}. For the fields in question {{targetColumns}}, the current jQuery selectors are merely placeholders. It is imperative to substitute them with the precise column names as specified in the developer's request, aligning each field with its corresponding {label:columnName:controlType} for accurate and tailored form validation implementation.

### Form Validation on Next or Submit button click

Here is an example JavaScript code to add validation on Next or Submit button click:

```JavaScript
if (window.jQuery) {
    (function ($) {
        if (typeof (entityFormClientValidate) != 'undefined') {
            var originalValidationFunction = entityFormClientValidate;
            if (originalValidationFunction && typeof (originalValidationFunction) == ""function"") {
                entityFormClientValidate = function () {
                    originalValidationFunction.apply(this, arguments);
                    // do your custom validation here
                    // return false; // to prevent the form submit you need to return false
                    // end custom validation.
                    return true;
                };
            }
        }
    }(window.jQuery));
}
```

> [!NOTE]
> Refine the provided code snippet, which serves as an illustrative example for implementing form validation. The developer's request specifies the table name as - {{targetEntity}}  and includes associated field information in the format {label:columnName:controlType}. For the fields in question {{targetColumns}}, the current jQuery selectors are merely placeholders. It is imperative to substitute them with the precise column names as specified in the developer's request, aligning each field with its corresponding {label:columnName:controlType} for accurate and tailored form validation implementation.

### Lookup Field Handling

```javascript
// Set lookup value
function setLookup(fieldName, id, name, entityType) {
    $('#' + fieldName).val(id);
    $('#' + fieldName + '_name').val(name);
    $('#' + fieldName + '_entityname').val(entityType);
}

// Get lookup value
function getLookup(fieldName) {
    return {
        id: $('#' + fieldName).val(),
        name: $('#' + fieldName + '_name').val(),
        entityType: $('#' + fieldName + '_entityname').val()
    };
}
```

## Prepopulating Forms

### From Query String
```liquid
<a href="/contact-form?firstname={{ user.firstname }}&lastname={{ user.lastname }}">
    Edit Your Info
</a>
```

### From Current User
```liquid
{% entityform name: 'Profile Form' %}
{% if user %}
    <script>
        $(document).ready(function() {
            $('#emailaddress1').val('{{ user.emailaddress1 }}');
            $('#firstname').val('{{ user.firstname }}');
        });
    </script>
{% endif %}
```

### Using Entity Reference

Pass record ID to edit mode:
```liquid
<a href="/edit-contact?id={{ contact.id }}">Edit Contact</a>
```

## Form Validation

### Server-Side Validation
Configure in Form Metadata:
- Required fields
- Regex validation patterns
- Range validation
- Custom error messages

### Client-Side Validation
```javascript
// Custom validation function
window.validateCustomField = function() {
    const value = $('#custom_field').val();

    if (value.length < 5) {
        // Show validation error
        $('#custom_field').closest('.control').addClass('has-error');
        return false;
    }

    return true;
};
```

## File Upload Handling

### Notes Attachment
Enable attachments through form settings:
- Allow file attachments
- Restrict file types
- Set maximum file size

```javascript
// Validate file upload
$('#AttachFile').change(function() {
    const file = this.files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (file.size > maxSize) {
        alert('File size must be less than 5MB');
        $(this).val('');
    }
});
```

## Subgrid Integration

Basic forms can include subgrids from the model-driven form:

```javascript
// Refresh subgrid
function refreshSubgrid(subgridName) {
    const subgrid = document.querySelector(`[data-name="${subgridName}"]`);
    if (subgrid) {
        // Trigger refresh
        $(subgrid).trigger('refresh');
    }
}
```

## Success Message Customization

### Using Liquid
```liquid
{% if request.params.success == 'true' %}
    <div class="alert alert-success">
        Thank you for your submission, {{ user.firstname }}!
    </div>
{% endif %}
```

### Redirect with Parameters
Configure redirect URL with Liquid:
```
/thank-you?name={{firstname}}&email={{emailaddress1}}
```

## Common Patterns

### Contact Us Form
```liquid
{% if user %}
    {% entityform name: 'Authenticated Contact Form' %}
{% else %}
    {% entityform name: 'Anonymous Contact Form' %}
{% endif %}
```

### Profile Edit Form
```liquid
{% if user %}
    {% entityform name: 'Profile Edit' id: user.id %}
{% else %}
    <p>Please <a href="/sign-in">sign in</a> to edit your profile.</p>
{% endif %}
```

### Conditional Form Display
```liquid
{% if page.adx_entityform %}
    {% entityform id: page.adx_entityform.id %}
{% else %}
    <p>No form configured for this page.</p>
{% endif %}
```

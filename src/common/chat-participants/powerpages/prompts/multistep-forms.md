# Power Pages Multistep Forms (Web Forms)

Multistep forms (formerly web forms) allow users to complete complex data entry across multiple steps with conditional branching.

## Creating a Multistep Form

Multistep forms are configured in the Portal Management app:
1. Create a Multistep Form record
2. Add Multistep Form Steps for each step
3. Configure step metadata and transitions
4. Add to a webpage

## Liquid Tag Usage

### Basic Webform Tag
```liquid
{% webform name: 'Registration Wizard' %}
```

### With Form ID
```liquid
{% webform id: '00000000-0000-0000-0000-000000000000' %}
```

## Step Types

| Type | Description |
|------|-------------|
| Load Form | Display a model-driven form |
| Load Tab | Display specific tab from a form |
| Load User Control | Load custom user control |
| Redirect | Navigate to another URL |
| Condition | Branch based on conditions |

## Step Configuration

### Load Form Step
- **Name**: Step identifier
- **Table Name**: Dataverse table
- **Form Name**: Model-driven form to display
- **Mode**: Insert, Edit, or ReadOnly
- **Next Step**: Step to navigate to on success

### Condition Step
Branch flow based on record values:
```
Condition Type: If condition
Attribute: statecode
Operator: Equals
Value: 0
```

## Form Progression

### Linear Flow
```
Step 1 (Contact Info) → Step 2 (Address) → Step 3 (Review) → Thank You
```

### Conditional Flow
```
Step 1 (Type Selection)
    ↓ If Type = Individual
    Step 2A (Individual Details)
    ↓ If Type = Organization
    Step 2B (Organization Details)
    ↓
Step 3 (Review) → Thank You
```

## JavaScript Integration

### Step Events

```javascript
// Before step load
$(document).on('webform.stepload', function(e, data) {
    console.log('Loading step:', data.stepName);
});

// After step renders
$(document).on('webform.steprendered', function(e, data) {
    console.log('Step rendered:', data.stepName);
    // Customize step here
});

// Before moving to next step
$(document).on('webform.nextstep', function(e, data) {
    // Validate before proceeding
    if (!customValidation()) {
        e.preventDefault();
        return false;
    }
});

// Before moving to previous step
$(document).on('webform.previousstep', function(e, data) {
    console.log('Going back from:', data.currentStep);
});
```

### Step Navigation

```javascript
// Get current step info
function getCurrentStep() {
    return $('#EntityFormControl').data('currentStep');
}

// Navigate programmatically (if allowed)
function goToStep(stepNumber) {
    $(document).trigger('webform.navigate', { step: stepNumber });
}
```

### Form Data Across Steps

```javascript
// Store data between steps (client-side)
const formData = {};

$(document).on('webform.nextstep', function(e, data) {
    // Save current step data
    formData[data.currentStep] = {
        firstname: $('#firstname').val(),
        lastname: $('#lastname').val()
    };
});

$(document).on('webform.steprendered', function(e, data) {
    // Restore saved data if going back
    if (formData[data.stepName]) {
        $('#firstname').val(formData[data.stepName].firstname);
        $('#lastname').val(formData[data.stepName].lastname);
    }
});
```

## Progress Indicator

### Default Progress Bar
The webform automatically displays progress when configured.

### Custom Progress Indicator
```liquid
{% webform name: 'Wizard' %}

<style>
.webform-progress {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
}

.webform-progress .step {
    flex: 1;
    text-align: center;
    padding: 10px;
    background: #f0f0f0;
    border-radius: 4px;
    margin: 0 5px;
}

.webform-progress .step.active {
    background: #007bff;
    color: white;
}

.webform-progress .step.completed {
    background: #28a745;
    color: white;
}
</style>

<script>
$(document).on('webform.steprendered', function(e, data) {
    // Update progress indicator
    $('.webform-progress .step').removeClass('active');
    $('.webform-progress .step[data-step="' + data.stepIndex + '"]').addClass('active');

    // Mark previous steps as completed
    for (let i = 0; i < data.stepIndex; i++) {
        $('.webform-progress .step[data-step="' + i + '"]').addClass('completed');
    }
});
</script>
```

## Step Validation

### Required Fields
Configure in step metadata:
```
Required: true
Validation Error Message: "This field is required"
```

### Custom Validation

```javascript
// Validate step before proceeding
$(document).on('webform.nextstep', function(e, data) {
    const currentStep = data.stepName;

    if (currentStep === 'Contact Information') {
        const email = $('#emailaddress1').val();
        if (!isValidEmail(email)) {
            alert('Please enter a valid email address');
            e.preventDefault();
            return false;
        }
    }

    if (currentStep === 'Address') {
        const zip = $('#address1_postalcode').val();
        if (!isValidZipCode(zip)) {
            alert('Please enter a valid ZIP code');
            e.preventDefault();
            return false;
        }
    }
});

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidZipCode(zip) {
    return /^\d{5}(-\d{4})?$/.test(zip);
}
```

## Conditional Branching

### Configuration
Condition steps evaluate record attributes:
```
Step Type: Condition
Condition Expression:
    attribute="accounttype"
    operator="equals"
    value="1"
```

### Dynamic Branching with JavaScript
```javascript
$(document).on('webform.beforecondition', function(e, data) {
    // Override condition evaluation
    const accountType = $('#accounttypecode').val();

    if (accountType === '1') {
        data.nextStep = 'Individual Details';
    } else {
        data.nextStep = 'Organization Details';
    }
});
```

## Session Management

Webforms maintain state across browser sessions:

### Session Timeout
Configure session timeout in site settings:
```
Webform/SessionTimeout = 30 (minutes)
```

### Resume In-Progress Form
```liquid
{% if user %}
    {% assign inProgressForms = user | webform_sessions %}
    {% if inProgressForms.size > 0 %}
        <div class="alert alert-info">
            <p>You have an in-progress registration:</p>
            <a href="/registration?session={{ inProgressForms[0].id }}" class="btn btn-primary">
                Continue Registration
            </a>
        </div>
    {% endif %}
{% endif %}
```

## Metadata Configuration

### Step Metadata Options
- **Mode**: Insert, Edit, ReadOnly
- **Entity Source Type**: Query String, Previous Step, Record Associated to Current Portal User
- **Record Source Attribute**: Attribute containing source record ID
- **Enable Entity Permissions**: Enforce table permissions

### Field Metadata
- **Label**: Override field label
- **Default Value**: Pre-populate values
- **Read-Only**: Make field read-only
- **Required**: Make field required
- **CSS Class**: Custom styling

## Common Patterns

### Registration Wizard
```
Step 1: Account Type Selection (Condition)
    ↓ Individual
    Step 2A: Personal Information
    ↓ Business
    Step 2B: Company Information
    ↓
Step 3: Contact Details
    ↓
Step 4: Review & Submit
    ↓
Redirect: Thank You Page
```

### Application Form
```liquid
{% webform name: 'Job Application' %}

<script>
$(document).on('webform.steprendered', function(e, data) {
    if (data.stepName === 'Review') {
        // Display summary of all entered data
        displayApplicationSummary();
    }
});

function displayApplicationSummary() {
    // Fetch and display submitted data
    const sessionId = getWebformSessionId();

    $.get('/api/application-summary/' + sessionId, function(data) {
        $('#summary-container').html(renderSummary(data));
    });
}
</script>
```

### Save and Continue Later
```javascript
// Save progress button
$('#saveProgressBtn').click(function() {
    // Form automatically saves, just notify user
    const resumeUrl = window.location.href;

    alert('Your progress has been saved. You can resume at:\n' + resumeUrl);

    // Optionally email the link
    if ($('#emailProgress').is(':checked')) {
        sendProgressEmail(resumeUrl);
    }
});
```

## Styling Multistep Forms

```css
/* Step container */
.webform-step {
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
    margin-bottom: 20px;
}

/* Navigation buttons */
.webform-navigation {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
}

.webform-navigation .btn-previous {
    background-color: #6c757d;
}

.webform-navigation .btn-next {
    background-color: #007bff;
}

.webform-navigation .btn-submit {
    background-color: #28a745;
}

/* Progress bar */
.webform-progress-bar {
    height: 4px;
    background-color: #e9ecef;
    border-radius: 2px;
    margin-bottom: 20px;
}

.webform-progress-bar .progress {
    height: 100%;
    background-color: #007bff;
    border-radius: 2px;
    transition: width 0.3s ease;
}
```

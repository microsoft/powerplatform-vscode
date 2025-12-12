# Liquid Tags for Power Pages

## Include Tag
Include reusable web templates:
```liquid
{% include 'Header' %}
{% include 'Navigation' %}
{% include 'Footer' %}
```

### Passing parameters
```liquid
{% include 'Card' title: 'My Title', content: page.adx_copy %}
```

In the included template:
```liquid
<div class="card">
  <h3>{{ title }}</h3>
  <div>{{ content }}</div>
</div>
```

## Block and Extends

### Base template (Layout)
```liquid
<!DOCTYPE html>
<html>
<head>
  <title>{% block title %}Default Title{% endblock %}</title>
</head>
<body>
  {% block content %}{% endblock %}
</body>
</html>
```

### Child template
```liquid
{% extends 'Layout' %}

{% block title %}{{ page.title }}{% endblock %}

{% block content %}
  <h1>{{ page.title }}</h1>
  {{ page.adx_copy }}
{% endblock %}
```

## Editable Tag
Make content editable in the portal editor:
```liquid
{% editable page 'adx_copy' type: 'html' %}
```

### Editable types
- `html` - Rich text editor
- `text` - Plain text
- `image` - Image selector

### Editable with default
```liquid
{% editable snippets 'Welcome Message' type: 'html', default: '<p>Welcome!</p>' %}
```

## Entity Tags

### entitylist
Render an entity list (list):
```liquid
{% entitylist id: list_id %}
  {% for item in entitylist.records %}
    {{ item.name }}
  {% endfor %}
{% endentitylist %}
```

### entityform
Render an entity form (basic form):
```liquid
{% entityform id: form_id %}
{% endentityform %}
```

### entityview
Access view data:
```liquid
{% entityview logical_name: 'contact', name: 'Active Contacts' %}
  {% for contact in entityview.records %}
    {{ contact.fullname }}
  {% endfor %}
{% endentityview %}
```

## FetchXML Tag
Query Dataverse directly:
```liquid
{% fetchxml query %}
<fetch top="10">
  <entity name="contact">
    <attribute name="fullname" />
    <attribute name="emailaddress1" />
    <filter>
      <condition attribute="statecode" operator="eq" value="0" />
    </filter>
    <order attribute="fullname" />
  </entity>
</fetch>
{% endfetchxml %}

{% for contact in query.results.entities %}
  <p>{{ contact.fullname }} - {{ contact.emailaddress1 }}</p>
{% endfor %}
```

### FetchXML with related entities
```liquid
{% fetchxml accounts_query %}
<fetch top="5">
  <entity name="account">
    <attribute name="name" />
    <link-entity name="contact" from="parentcustomerid" to="accountid">
      <attribute name="fullname" alias="contact_name" />
    </link-entity>
  </entity>
</fetch>
{% endfetchxml %}
```

## Substitution Tag
Insert content without encoding:
```liquid
{% substitution %}
  {{ page.adx_copy }}
{% endsubstitution %}
```

## Raw Tag
Output Liquid syntax without processing:
```liquid
{% raw %}
  {{ this will not be processed }}
{% endraw %}
```

## Comment Tag
Add comments (not rendered):
```liquid
{% comment %}
  This is a comment and won't appear in output
{% endcomment %}
```

## Web Form Tags

### webform
Render a multistep form:
```liquid
{% webform id: webform_id %}
{% endwebform %}
```

## Chart Tag
Render a Dataverse chart:
```liquid
{% chart id: chart_id %}
{% endchart %}
```

## PowerBI Tag
Embed Power BI reports:
```liquid
{% powerbi path: '/reports/myreport' %}
```

## Redirect Tag
Redirect to another URL:
```liquid
{% redirect 'https://example.com' %}
{% redirect sitemarkers['Home'].url %}
```

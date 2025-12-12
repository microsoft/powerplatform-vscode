# Liquid Template Language for Power Pages

Liquid is an open-source template language used in Power Pages to add dynamic content to pages.

## Basic Syntax

### Output Tags
Use double curly braces to output content:
```liquid
{{ page.title }}
{{ user.fullname }}
```

### Logic Tags
Use curly braces with percent signs for logic:
```liquid
{% if user %}
  Hello, {{ user.fullname }}!
{% endif %}
```

## Common Objects

### page
Access current page properties:
- `{{ page.title }}` - Page title
- `{{ page.id }}` - Page GUID
- `{{ page.url }}` - Page URL
- `{{ page.adx_copy }}` - Page copy content

### request
Access HTTP request information:
- `{{ request.url }}` - Current URL
- `{{ request.params['paramname'] }}` - Query string parameter
- `{{ request.path }}` - URL path

### user
Access current user (if authenticated):
- `{{ user.fullname }}` - User's full name
- `{{ user.email }}` - User's email
- `{{ user.id }}` - User's contact GUID
- `{{ user.roles }}` - User's web roles

### sitemarkers
Access site markers for navigation:
```liquid
{% assign home = sitemarkers['Home'] %}
<a href="{{ home.url }}">{{ home.name }}</a>
```

### snippets
Access content snippets:
```liquid
{{ snippets['Footer Content'] }}
```

### weblinks
Access web link sets for navigation:
```liquid
{% assign links = weblinks['Primary Navigation'] %}
{% for link in links.weblinks %}
  <a href="{{ link.url }}">{{ link.name }}</a>
{% endfor %}
```

### settings
Access site settings:
```liquid
{{ settings['site/name'] }}
```

## Control Flow

### if/elsif/else
```liquid
{% if user %}
  Welcome back, {{ user.fullname }}!
{% elsif request.params['guest'] %}
  Welcome, guest!
{% else %}
  Please sign in.
{% endif %}
```

### unless
```liquid
{% unless user %}
  Please sign in to continue.
{% endunless %}
```

### case/when
```liquid
{% case page.adx_template %}
  {% when 'Home' %}
    Home page layout
  {% when 'Contact' %}
    Contact page layout
  {% else %}
    Default layout
{% endcase %}
```

## Iteration

### for loop
```liquid
{% for item in collection %}
  {{ item.name }}
{% endfor %}
```

### Loop variables
- `forloop.index` - Current iteration (1-based)
- `forloop.index0` - Current iteration (0-based)
- `forloop.first` - True if first iteration
- `forloop.last` - True if last iteration
- `forloop.length` - Total iterations

### limit and offset
```liquid
{% for item in collection limit:5 offset:2 %}
  {{ item.name }}
{% endfor %}
```

## Filters

### String Filters
- `{{ 'hello' | upcase }}` → HELLO
- `{{ 'HELLO' | downcase }}` → hello
- `{{ 'hello' | capitalize }}` → Hello
- `{{ '  hello  ' | strip }}` → hello
- `{{ 'hello' | size }}` → 5
- `{{ 'hello world' | split: ' ' }}` → ['hello', 'world']
- `{{ 'hello' | append: ' world' }}` → hello world
- `{{ 'hello world' | replace: 'world', 'there' }}` → hello there

### Number Filters
- `{{ 4 | plus: 2 }}` → 6
- `{{ 4 | minus: 2 }}` → 2
- `{{ 4 | times: 2 }}` → 8
- `{{ 4 | divided_by: 2 }}` → 2
- `{{ 4.5 | round }}` → 5
- `{{ 4.5 | floor }}` → 4
- `{{ 4.5 | ceil }}` → 5

### Date Filters
```liquid
{{ now | date: 'MMMM dd, yyyy' }}
{{ page.modifiedon | date: 'MM/dd/yyyy' }}
```

### Array Filters
- `{{ array | first }}` - First element
- `{{ array | last }}` - Last element
- `{{ array | size }}` - Array length
- `{{ array | join: ', ' }}` - Join elements
- `{{ array | sort }}` - Sort array
- `{{ array | reverse }}` - Reverse array

## Variable Assignment

### assign
```liquid
{% assign greeting = 'Hello' %}
{{ greeting }}
```

### capture
```liquid
{% capture full_greeting %}
  Hello, {{ user.fullname }}!
{% endcapture %}
{{ full_greeting }}
```

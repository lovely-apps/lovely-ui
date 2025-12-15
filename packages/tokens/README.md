# Tokens

This is our token library. To build the tokens, run `npm run build:tokens`.

## Attributes

We define an item as an attribute by setting the name of token to `attribute:name`. All children of that named entity will then get that attached as an attribute during transforms so that we can better name and categorize tokens.

### Attribute Definitions

- `folder` - Folder grouping
- `token` - Top level kind (e.g. semantic)
- `type` - Type of token (e.g. background)
- `kind` - Kind of item (e.g. component)
- `item` - Item (e.g. page)
- `style` - Style of item (e.g. primary, callout)
- `variant` - Variant of item (e.g. 100)
- `screen` - Screen size (e.g. small screen)
- `theme` - Theme or mode (e.g. light)
- `meaning` - Semantic meaning (e.g. destructive)
- `state` - State of item (e.g. active)
- `attribute` - Attribute of item (e.g. padding)
- `value` - Value or scale (e.g. x)

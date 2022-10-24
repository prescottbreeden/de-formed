<p align="center">
  <img src="https://user-images.githubusercontent.com/35798153/157611790-96f35e8b-ee4f-44e4-b3c9-1864900a02f2.png" />
</p>

[![npm version](https://badge.fury.io/js/@de-formed%2Fbase.svg)](https://badge.fury.io/js/@de-formed%2Fbase)
[![Known Vulnerabilities](https://snyk.io/test/github/prescottbreeden/de-formed/badge.svg)](https://snyk.io/test/github/prescottbreeden/de-formed)
![example workflow](https://github.com/prescottbreeden/de-formed/actions/workflows/main.yml/badge.svg)
[![codecov](https://codecov.io/gh/prescottbreeden/de-formed/branch/main/graph/badge.svg?token=a1u71NhJwb)](https://codecov.io/gh/prescottbreeden/de-formed)
![size](https://img.shields.io/bundlephobia/minzip/@de-formed/base)

@De-Formed Validations offers a highly customizable API to create form and data
validations. The functions in this library are aimed at unifying the
implementation of @De-Formed for targeted JavaScript libraries or frameworks.
Use these to either create an implementation for a library that doesn't exist
yet or to create your own variant that suits your needs.

@De-Formed is used and trusted in production at Google and Microsoft.

## Why Use De-Formed?

1. **Modular** - decoupled from your form architecture.
1. **Composable** - turn your validations and forms into Lego bricks.
1. **Extendable** - add/modify the API as you see fit
1. **Unopinionated** - customize your UX to the Moon 🚀
1. **Lightweight** - [compare it on bundlephobia](https://bundlephobia.com/package/@de-formed/react-validations)
1. **Easy to Use** - functions all the way down
1. **Easy to Test** - unit test your validation rules

---

## Install

```
yarn add @de-formed/base
```

```
npm i @de-formed/base
```

### Current Implementations

This repository is to generate customized De-Formed variants. If you are
looking for an existing solution, please visit one of the links below.

- [React Hook](https://github.com/prescottbreeden/de-formed-validations-react)
- [Node / VanillaJS](https://github.com/prescottbreeden/de-formed-validations-node)


---

## Example Schemas

Auto-props are functions that apply simple validation rules for strings and
numbers. Auto-props only work for keys of a schema that match the name of a
property. 

```ts
const PersonValidation = Validation<Person>({
  name: [required(), shorterThan(12)],
  age: [min(42), max(100)],
  agreement: [is(true, 'Must accept terms.')],
});
```

Available Auto-props are:

- `required` (string/number)
- `matches` (string)
- `shorterThan` (string)
- `longerThan` (string)
- `min` (number)
- `max` (number)
- `is` (any type, also accepts a predicate function)

Auto-props are great for handling very simple rules, however more complex
validations should use the explicit schema format:

```ts
const PersonValidation = () =>
  Validation<Person>({
    name: [
      required(),
      {
        error: 'Cannot be bob.',
        validation: ({ name }) => name !== 'bob',
      },
      {
        error: ({ name }) => `${name} must be dingo.`,
        validation: ({ dingo, name }) => (dingo ? name === 'dingo' : true),
      },
    ],
    age: [min(42, 'Must be 42 or older.')],
    agreement: [is(true, 'Must accept terms')],
  });
```

---

## Yup Compatible

If you are already using Yup or wish to use its schema design, simply pass your
Yup schema to @De-Formed with the following config option

```ts
const schema = Yup.object({
  name: Yup.string()
    .required('Name is required.')
    .test({
      message: 'Cannot be bob.',
      test: (value: string | undefined) => value !== 'bob',
    })
    .when('dingo', {
      is: true,
      then: Yup.string().test({
        message: 'Must be dingo.',
        test: (value: string | undefined) => value === 'dingo',
      }),
    }),
  age: Yup.number().test({
    message: 'Must be 42 or older.',
    test: (value: number | undefined) => (value ? value >= 42 : false),
  }),
  agreement: Yup.boolean().isTrue('Must accept terms'),
});

```
```ts
const v = Validation(schema, { yup: true })
```
---

## Conditional Validation with Polymorphic Types

There are times where a single form can encapsulate the creation or editing of
different domain types that are grouped into a super type, such as a Pet form
that could be for various types of pets with different validation requirements:

```ts
// schema using the React Hook
const PetValidationSchema = () => {
  return useValidation<Pet>({
    favoriteChewToy: [
      {
        error: 'Favorite Chew Toy is required.',
        validation: pet => isDog(pet) ? !!pet.favoriteChewToy : true
      },
    ],
    sleepingHabits: [
      {
        error: 'Sleeping Habits is required.',
        validation: pet => isCat(pet) ? !!pet.sleepingHabits : true
      },
    ],
    isDancing: [
      {
        error: 'Crabs should always be dancing',
        validation: pet => isCrab(pet) ? pet.isDancing : true
      },
    ],
  })
}
```
---

## Flexible Schema Definitions

The @De-Formed schema is designed to be logical but flexible. The type provided
to the constructor does not restrict the rules that can be applied. This allows
developers to handle complex validation requirements with various approaches.

```ts
// our Blog type
type Blog = {
  title: string
  author: string
  content: string
  terms: boolean
  status: 'draft' | 'published'
}
```
Requirements for publishing a blog vs auto-saving:

Approach #1 -- create a schema that defines our publishing validations but has
an additional rule for auto-saving:
```ts
// react hook example
const useBlogValidation = () => {
  return useValidation<Blog>({
    title: [required()],
    author: [required()],
    content: [required()],
    terms: [is(true)],
    canAutoSave: [ // <-- notice this key does not exist in the Blog type
      {
        error: "Please provide a title before saving your progress",
        validation: ({ title, status }) =>
          title.trim().length > 0 && status === 'draft'
      }
    ]
  })
}
```
```ts
// inside a React Component
const { validate } = useBlogValidation()

const autoSave = () => {
  if(validate('canAutoSave', blog)) {
    // auto save logic
  }
}

const publish = () => {
  // use the overloads for validateAll to call the validations for publishing
  if(validateAll(blog, ['title', 'author', 'content', 'terms'])) {
    // publish blog logic
  }
}
```
This approach might make the most sense in some scenarios, but an alternative
might be to compose our blog validation with another schema to handle
auto-saving versus publishing. 

Approach #2 -- compose validation requirements into two schemas

```ts
// same schema as before but with canAutoSave removed
const useBlogValidation = () => {
  return useValidation<Blog>({
    title: [required()],
    author: [required()],
    content: [required()],
    terms: [is(true)],
  })
}
```
```ts
// new schema with dedicated auto-save and publish validations composed with
// blog validations
const useBlogSubmitValidation = () => {
  const { validateAll } = useBlogValidation()

  return useValidation<Blog>({
    canAutoSave: [
      {
        error: "Please provide a title before saving your progress",
        validation: ({ title, status }) =>
          title.trim().length > 0 && status === 'draft'
      }
    ],
    canPublish: [
      {
        error: 'Not all requirements have been met for publishing.',
        validation: validateAll
      }
    ]
  })
}
```
```ts
// inside a React Component
const { validate } = useBlogSubmitValidation()

const autoSave = () => {
  if(validate('canAutoSave', blog)) {
    // auto save logic
  }
}

const publish = () => {
  if(validate('canPublish', blog)) {
    // publish blog logic
  }
}
```
An advantage here is that the rules are now more declarative and
self-documenting. It is clear to see A) what is a valid blog, B) what are the
requirements to auto-save, and C) what are the requirements to publish. All of
these requirements encapsulated within a hook and easily re-shared with other
components that might need to do similar validation checks.

## Composing Forms with Validations
In the previous example, we showed how you can be more expressive with composition
as validation requirements become more complex. However, if all we communicated
to a user was `Not all requirements have been met for publishing.` we would be
providing a very poor experience. However, we can compose forms just the same
as we composed our validation schemas.

To do this, we will create two different abstractions:
- a Blog Form
- a Blog Controller

The form will contain our blog validations and provide user feedback, while the
blog controller will contain auto-saving and publishing logic. We can then
communicate to our form when it needs to display all errors to a user due to an
event outside the form itself.

```tsx
// BlogController.tsx
const BlogController = () => {
  const [blog, setBlog] = React.useState({ /** initial blog state **/ })
  const [publishFailed, setPublishFailed] = React.useState(false)
  const { getError, validate } = useBlogSubmitValidation()

  const onChange = (data: Partial<Blog>) =>
    setBlog(prev => ({ ...prev, ...data }))

  const publish = () => {
    if(validate('canPublish', blog)) {
      setPublishFailed(false)
      // publish blog logic
    } else {
      setPublishFailed(true)
    }
  }

  return (
    <>
      <h2>Edit Blog</h2>
      <BlogForm
        data={blog}
        onChange={onChange}
        publishFailed={publishFailed}
      />
      <button onClick={publish}>Publish Blog</button>
      {getError('canPublish') && <p>{getError('canPublish')}</p>}
    </>
  )
}
```

```tsx
// BlogForm.tsx
const BlogForm = ({ data, onChange, publishFailed }) => {
  // instantiate our blog validations
  const {
    getError,
    validateOnChange,
    validateOnBlur,
    validateAll
  } = useBlogValidation()

  // create an onchange handler that can transform an event into a partial
  const handleChange = (event) => onChange({
    [event.target.name]: [event.target.value]
  })

  // listen for publish failed events
  React.useEffect(() => {
    // if a publish event has failed, run all validations
    publishFailed && validateAll(data)
  }, [publishFailed])

  return (
    <>
      <div>
        <label htmlFor="title">Blog Title</label>
        <input
          id="title"
          name="title"
          onBlur={validateOnBlur(data)}
          onChange={validateOnChange(handleChange, data)}
          value={data.title}
        />
        {getError('title') && <p>{getError('title')}</p>}
      </div>
      <div>
        <label htmlFor="author">Author</label>
        <input
          id="author"
          name="author"
          onBlur={validateOnBlur(data)}
          onChange={validateOnChange(handleChange, data)}
          value={data.author}
        />
        {getError('author') && <p>{getError('author')}</p>}
      </div>
      <div>
        <label htmlFor="content">Content</label>
        <input
          id="content"
          name="content"
          onBlur={validateOnBlur(data)}
          onChange={validateOnChange(handleChange, data)}
          value={data.content}
        />
        {getError('content') && <p>{getError('content')}</p>}
      </div>
    </>
  )
}
```
Now when a publish event fails, the child form is notified to run its
validations to provide feedback to the user about what specifically failed.

This pattern can be used to generate form partials that can be reused and
composed in as many parts of the application as necessary. Trying to compose
forms with form libraries that are dependent on redux under the hood and use
form tags is about as pleasant as trying to administer your own colonoscopy.
Furthermore, form tags do not provide any necessary accessibility for the web.
[More on web accessibility for forms.](https://www.w3.org/WAI/tutorials/forms/)

In addition, all of the form logic is decoupled from the validation logic.
@De-Formed can be easily removed or updated with different validation
requirements without affecting the data flow of the form.

Lastly, customizing the behavior of the validations is the most important aspect
of creating a great user experience. @De-Formed provides complete control over
how you wish validation behavior to occur. For example, if we don't want
content validations to fire onBlur events, we simply remove the binding on the
content input.

---

## Co-Dependent Validations

Because @De-Formed provides complete control over what validations you want to
run at any given event, creating user experiences with co-dependent validations
is a breeze.

Let's take an example where we have a multi-input form element that selects a
type of measurement, with a second input that chooses a particular value. Our
validation requirements are pretty strict in this case, where depending on the
measurement, only some values are acceptable.

```ts
type Quanity = {
  measurement: 'height' | 'length' | 'width'
  value: number
  // imagine there are additional properties but these are the two that are co-dependent
}
const useQuantityValidation = () => {
  return useValidation<Quantity>({
    value: [
      {
        error: 'height must be between 4 and 20',
        validation: ({ measurement, value }) =>
          measurement === 'height' ? value >= 4 <= 20 : true
      },
      {
        error: 'length must be between 8 and 42',
        validation: ({ measurement, value }) =>
          measurement === 'length' ? value >= 8 <= 42 : true
      },
      {
        error: 'width must be between 10 and 12',
        validation: ({ measurement, value }) =>
          measurement === 'width' ? value >= 10 <= 12 : true
      },
    ]
  }),
}
```
Each time a user changes the measurement select box, we want to run the value
validations so that they don't continue with the form until the value is valid
according to the measurement selected:

```tsx
const QuantityForm = () => {
  const [quantity, setQuantity] = React.useState<Quantity>({
    measurement: ''
    value: 0
  })

  // we are going to forgo the auto-magic methods and build our own use case
  const { getError, validate, validateIfDirty } = useQuantityValidation()

  const handleChange = (data: Partial<Quantity>) =>
    setQuantity(prev => ({ ...prev, ...data }))

  const validateOnChange = (event) => {
    cosnt updated = { ...quantity, [event.target.name]: event.target.value }
    if (event.target.name === 'measurement') {
      validateAllIfDirty(updated, ['measurement', 'value'])
    } else {
      validateIfDirty(event.target.name, updated)
    }
    onChange(updated)
  }

  const validateOnBlur = (event) => {
    cosnt updated = { ...quantity, [event.target.name]: event.target.value }
    if (event.target.name === 'measurement') {
      validateAll(updated, ['measurement', 'value'])
    } else {
      validate(event.target.name, updated)
    }
  }

  return (
    <>
      <select
        name="measurement"
        onBlur={ValidateOnBlur}
        onChange={validateOnChange}
        value={quantity.measurement}
      >
        <option value="height">Height</option>
        <option value="length">Length</option>
        <option value="width">Width</option>
      </select>
      <input
        name="value"
        onBlur={validateOnBlur}
        onChange={validateOnChange}
        type="number"
        value={quantity.value}
      />
      {getError('value') && <p>{getError('value')</p>}}
      {/** other inputs **/}
    </>
  )
}
```
Under the hood, `validateOnChange` and `validateOnBlur` run `validateIfDirty`
and `validate` respectively, but just snag the event name from the event to
look up what validations it should run. Here, we leveraged the same idea but
customized it so that one particular event name always fires two validations.

The important point here is that no matter what the UX of your validations you
want to create is, @De-Formed gives you tremendous customization options.

---

## Rendering Server Errors to a UI

Developers using a Node backend can use the Node implementation to easily share
errors with the frontend to render errors directly onto the inputs:

```ts
// example Node controller logic to save a pet
const createNewPet = async (pet: Pet) => {
  // instantiate a fresh validation state
  const v = Validation<Pet>({
    license: [matches(/some-regex/), 'License must be valid'],
    exists: [is(false, 'Pet already exists')],
  });
  const existing = await Pet.find(pet);
  v.validateAll({ license: pet.license, exists: Boolean(existing) })
  if (v.isValid) {
    const newPet = await Pet.create(pet) 
    return { errors: v.validationState, pet: newPet };
  } else {
    return { errors: v.validationState, pet: null };
  }
};
```

```ts
// example React UI to render API errors directly on inputs
const { validateAll, setValidationState } = usePetValidation()

const handleSave = () => {
  if (validateAll(pet)) {
    savePet(pet).then((response) => {
      if (response.pet) {
        // success -> do happy path
      } else {
        // ruh-roh -> display API errors
        setValidationState(response.errors);
      }
    });
  } 
};
```
If your server isn't built with JavaScript, write a transformation that suitably
converts your APIs error payload into a validation state before calling
`setValidationState` to render errors on the DOM by their associated inputs.

---

## Async Validations

All validation functions for @De-Formed are synchronous for performance and
simplicity. Validations that require asynchronous logic can be abstracted to a
process before running your validation checks. 
 - better encapsulation around your validation state
 - allows validation state to be used in control flow
 - requires developers to handle their own blocking application states (e.g.,
    loading, processing, pre-flight checks, etc.).

---

## Internationalization

@De-Formed does not handle i18n internally, however i18n strings can be passed
anywhere that @De-Formed takes an error string. Default error messages
generated by auto-props are in English.

---

## More on the Validation Object

For a complete rundown of the API, please visit the [API Documentation](https://github.com/prescottbreeden/de-formed-validations-react)

---

## Creating your own implementation of @De-Formed

There are a number of reasons you might wish to build your own customized
Validation API:

1. An implementation of @De-Formed doesn't work with your target framework
1. Integration directly with a different state engine (e.g., redux)
1. Simplify and slim down the API to the only the functionality desired
1. Extend and add custom functionality to the API not provided
1. Customize @De-Formed to fit with other dependencies of your application

Perhaps you need @De-Formed to kick off a redux action every time a particular
validation fires? Perhaps you have a more preferred state engine you wish to
use? Instead of creating a wrapper around the default implementations which
creates an unnecessary layer of abstraction, additional performance cost, and
additional memory usage, you can simply import the factories and build your
own that suits your needs.

Implementing your own is as simple as using one of the current implementations
(e.g. @de-formed/react-validations or @de-formed/node-validations) as a
template and modify however you see fit. All you need is the factories provided
by @de-formed/base.

### Factories all the way down

De-Formed is built with factories that accept your state's getter and setter.
You can use a default implementation, or build your own and integrate with a
state engine of your choosing. If you need further customization, you can
modify the factories themselves in `index.ts` and use the `config` object to
pass around additional settings. Most low-level customizations will only
require you to modify the `updateProperty` however (as example) you may decide
that expanding the validation state to contain additional properties is
beneficial for your particular needs.

### Providing State and a Config object

- `Config` is an optional object that can be read anywhere in @De-Formed to
  modify its behavior.
- `ValidationState` can be an object or a function that returns an object
- `SetValidationState` is a function that updates the state

How state management is left purely to the implementation. See
`examples/vanilla.ts` for an example.

---

## Adding new implementations of @De-Formed to NPM

If there is no current implementation that works for your framework in the
@De-Formed ecosystem you can open a feature request with a PR containing your
implementation to make it available for others. The current `ValidationObject`
type is the intended de-facto implementation and should be adhered to for
consistency. If this object is missing functionality you think would benefit
@De-Formed, please make a feature request and provide an example of what you
would like to be available. Please keep in mind, while enhancements will be
eagerly reviewed, a huge motivation for @De-Formed is to keep it small
(~1-2kb) and simple.

---

## License

This project is licensed under the terms of the [MIT license](/LICENSE).

const schema = {

  // default properties

  _id: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
  },

  createdAt: {
    type: Date,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['admins'],
    onInsert: () => {
      return new Date();
    },
  },

  userId: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    resolveAs: {
      fieldName: 'user',
      type: 'User',
      resolver: (sequence, args, context) => {
        return context.Users.findOne({ _id: sequence.userId }, { fields: context.Users.getViewableFields(context.currentUser, context.Users)})
      },
      addOriginalField: true,
    }
  },

  // Custom Properties

  title: {
    type: String,
    optional: false,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['admins'],
  },

  slug: {
    type: String,
    optional: false,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['admins'],
  },

  description: {
    type: Object,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['admins'],
    control: 'EditorFormComponent',
    blackbox: true,
  },

  plaintextDescription: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
  },

  htmlDescription: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
  },

  /*
    Dummy field that resolves to the array of books that belong to a sequence
  */

  booksDummy: {
    type: Array,
    optional: true,
    viewableBy: ['guests'],
    resolveAs: {
      fieldName: 'books',
      type: '[Book]',
      resolver: (collection, args, context) => {
        const books = context.Books.find({collectionId: collection._id}, {sort: {number: 1}, fields: context.Users.getViewableFields(context.currentUser, context.Books)}).fetch();
        return books;
      }
    }
  },

  'booksDummy.$': {
    type: String,
    optional: true,
  },

  gridImageId: {
    type: String,
    optional: true,
    viewableBy: ["guests"],
    editableBy: ['admins'],
    insertableBy: ['admins'],
  },

  firstPageLink: {
    type: String,
    optional: true,
    viewableBy: ["guests"],
    editableBy: ["admins"],
    insertableBy: ["admins"],
  }
}


export default schema;

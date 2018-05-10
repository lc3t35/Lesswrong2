import { Posts } from "meteor/example-forum";
import ReactDOMServer from 'react-dom/server';
import { Components } from 'meteor/vulcan:core';
import React from 'react';
import Users from "meteor/vulcan:users";

const formGroups = {
  admin: {
    name: "admin",
    order: 2
  },
  event: {
    name: "event details",
    order: 1,
    label: "Event Details"
  }
};

const moderationGroup = {
  order:60,
  name: "moderation",
  label: "Moderation",
}

Posts.addField([
  /**
    URL (Overwriting original schema)
  */
  {
    fieldName: "url",
    fieldSchema: {
      order: 20,
      placeholder: "URL",
      control: 'EditUrl',
    }
  },
  /**
    Title (Overwriting original schema)
  */
  {
    fieldName: "title",
    fieldSchema: {
      order: 10,
      placeholder: "Title",
      control: 'EditTitle',
    },
  },

  /**
    categoriesIds: Change original Vulcan field to hidden
  */
  {
    fieldName: "categoriesIds",
    fieldSchema: {
      hidden: true,
    }
  },


  /**
    Ory Editor JSON
  */
  {
    fieldName: 'content',
    fieldSchema: {
      type: Object,
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['members'],
      insertableBy: ['members'],
      control: 'EditorFormComponent',
      blackbox: true,
      order: 25,
      form: {
        hintText:"Plain Markdown Editor",
        rows:4,
        multiLine:true,
        fullWidth:true,
        underlineShow:false,
        enableMarkDownEditor: true
      },
    }
  },

  /**
    Html Body field, made editable to allow access in edit form
  */
  {
    fieldName: 'htmlBody',
    fieldSchema: {
      type: String,
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['admins'],
      control: "textarea",
    }
  },

  {
    fieldName: 'htmlHighlight',
    fieldSchema: {
      type: String,
      optional: true,
      hidden:true,
      viewableBy: ['guests'],
    }
  },

  /**
    Legacy: Boolean used to indicate that post was imported from old LW database
  */
  {
    fieldName: 'legacy',
    fieldSchema: {
      type: Boolean,
      optional: true,
      hidden: false,
      defaultValue: false,
      viewableBy: ['guests'],
      editableBy: ['admin'],
      insertableBy: ['admin'],
      control: "checkbox",
    }
  },

  /**
    Legacy ID: ID used in the original LessWrong database
  */
  {
    fieldName: 'legacyId',
    fieldSchema: {
      type: String,
      optional: true,
      hidden: true,
      viewableBy: ['guests'],
      editableBy: ['members'],
      insertableBy: ['members'],
    }
  },

  /**
    Legacy Spam: True if the original post in the legacy LW database had this post
    marked as spam
  */
  {
    fieldName: 'legacySpam',
    fieldSchema: {
      type: Boolean,
      optional: true,
      defaultValue: false,
      hidden: true,
      viewableBy: ['guests'],
      editableBy: ['members'],
      insertableBy: ['members'],
    }
  },

  /**
    Feed Id: If this post was automatically generated by an integrated RSS feed
    then this field will have the ID of the relevant feed
  */
  {
    fieldName: 'feedId',
    fieldSchema: {
      type: String,
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['admins'],
      insertableBy: ['admins'],
      resolveAs: {
        fieldName: 'feed',
        type: 'RSSFeed',
        resolver: (post, args, context) => context.RSSFeeds.findOne({_id: post.feedId}, {fields: context.getViewableFields(context.currentUser, context.RSSFeeds)}),
        addOriginalField: true,
      },
      group: formGroups.admin,
    }
  },

  /**
    Feed Link: If this post was automatically generated by an integrated RSS feed
    then this field will have the link to the original blogpost it was posted from
  */
  {
    fieldName: 'feedLink',
    fieldSchema: {
      type: String,
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['admins'],
      insertableBy: ['admins'],
      group: formGroups.admin
    }
  },

  /**
    body: Changed original body attribute to be just a plain-text version of the
    original content, to allow for search.
  */
  {
    fieldName: 'body',
    fieldSchema: {
      type: String,
      optional: true,
      viewableBy: ['guests'],
      insertableBy: ['members'],
      editableBy: ['members'],
      hidden: true,
    }
  },

  /**
    legacyData: A complete dump of all the legacy data we have on this post in a
    single blackbox object. Never queried on the client, but useful for a lot
    of backend functionality, and simplifies the data import from the legacy
    LessWrong database
  */

  {
    fieldName: 'legacyData',
    fieldSchema: {
      type: Object,
      optional: true,
      viewableBy: ['admins'],
      insertableBy: ['admins'],
      editableBy: ['admins'],
      hidden: true,
      blackbox: true,
    }
  },

  /**
    lastVisitDateDefault: Sets the default of what the lastVisit of a post should be, resolves to the date of the last visit of a user, when a user is loggedn in. Returns null when no user is logged in;
  */

  {
    fieldName: 'lastVisitedAtDefault',
    fieldSchema: {
      type: Date,
      optional: true,
      hidden: true,
      viewableBy: ['guests'],
      resolveAs: {
        fieldName: 'lastVisitedAt',
        type: 'Date',
        resolver: (post, args, context) => {
          if(context.currentUser){
            const event = context.LWEvents.findOne({name:'post-view', documentId: post._id, userId: context.currentUser._id}, {sort:{createdAt:-1}});
            return event ? event.createdAt : post.lastVisitDateDefault;
          } else {
            return post.lastVisitDateDefault;
          }
        }
      }
    }
  },

  {
    fieldName: 'lastCommentedAt',
    fieldSchema: {
      type: Date,
      optional: true,
      hidden: true,
      viewableBy: ['guests'],
      onInsert: () => {
        return new Date();
      }
    }
  },

  /**
    curatedDate: Date at which the post was promoted to curated (null or false if it never has been promoted to curated)
  */

  {
    fieldName: 'curatedDate',
    fieldSchema: {
      type: Date,
      optional: true,
      viewableBy: ['guests'],
      insertableBy: ['sunshineRegiment', 'admins'],
      editableBy: ['sunshineRegiment', 'admins'],
      group: formGroups.admin,
    }
  },
  {
    fieldName: 'suggestForCuratedUserIds',
    fieldSchema: {
      type: Array,
      viewableBy: ['members'],
      insertableBy: ['trustLevel1', 'sunshineRegiment', 'admins'],
      editableBy: ['trustLevel1', 'sunshineRegiment', 'admins'],
      optional: true,
      label: "Suggested for Curated by",
      control: "UsersListEditor",
      resolveAs: {
        fieldName: 'suggestForCuratedUsernames',
        type: 'String',
        resolver: (post, args, context) => {
          // TODO - Turn this into a proper resolve field.
          // Ran into weird issue trying to get this to be a proper "users"
          // resolve field. Wasn't sure it actually needed to be anyway,
          // did a hacky thing.
          const users = _.map(post.suggestForCuratedUserIds,
            (userId => {
              return context.Users.findOne({ _id: userId }).displayName
            })
          )
          if (users.length) {
            return users.join(", ")
          } else {
            return null
          }
        },
        addOriginalField: true,
      }
    }
  },
  {
    fieldName: 'suggestForCuratedUserIds.$',
    fieldSchema: {
      type: String,
      optional: true
    }
  },

  /**
    frontpageDate: Date at which the post was promoted to frontpage (null or false if it never has been promoted to frontpage)
  */

  {
    fieldName: 'frontpageDate',
    fieldSchema: {
      type: Date,
      viewableBy: ['guests'],
      editableBy: ['members'],
      insertableBy: ['members'],
      optional: true,
      hidden: true,
    }
  },

  /**
    algoliaIndexAt: The last time at which the post has been indexed in Algolia's search Index.
    Undefined if it is has not been indexed.
  */

  {
    fieldName: 'algoliaIndexAt',
    fieldSchema: {
      type: Date,
      optional: true,
      viewableBy: ['guests'],
    }
  },

  {
    fieldName: 'collectionTitle',
    fieldSchema: {
      type: String,
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['admins'],
      insertableBy: ['admins']
    }
  },

  {
    fieldName: 'userId',
    fieldSchema: {
      type: String,
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['admins'],
      insertableBy: ['admins'],
      hidden: false,
      control: "text"
    }
  },

  {
    fieldName: 'canonicalSequenceId',
    fieldSchema: {
      type: String,
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['admins'],
      insertableBy: ['admins'],
      resolveAs: {
        fieldName: 'canonicalSequence',
        addOriginalField: true,
        type: "Sequence",
        resolver: (post, args, context) => {
          if (!post.canonicalSequenceId) return null;
          const sequence = context.Sequences.findOne({_id: post.canonicalSequenceId});
          return Users.restrictViewableFields(context.currentUser, context.Sequences, sequence);
        }
      },
      hidden: false,
      control: "text"
    }
  },

  {
    fieldName: 'canonicalCollectionSlug',
    fieldSchema: {
      type: String,
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['admins'],
      insertableBy: ['admins'],
      hidden: false,
      control: "text",
      resolveAs: {
        fieldName: 'canonicalCollection',
        addOriginalField: true,
        type: "Collection",
        resolver: (post, args, context) => {
          if (!post.canonicalCollectionSlug) return null;
          const collection = context.Collections.findOne({slug: post.canonicalCollectionSlug})
          return Users.restrictViewableFields(context.currentUser, context.Collections, collection);
        }
      }
    }
  },

  {
    fieldName: 'canonicalBookId',
    fieldSchema: {
      type: String,
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['admins'],
      insertableBy: ['admins'],
      hidden: false,
      control: "text",
      resolveAs: {
        fieldName: 'canonicalBook',
        addOriginalField: true,
        type: "Book",
        resolver: (post, args, context) => {
          if (!post.canonicalBookId) return null;
          const book = context.Books.findOne({_id: post.canonicalBookId});
          return Users.restrictViewableFields(context.currentUser, context.Books, book);
        }
      }
    }
  },

  {
    fieldName: 'canonicalNextPostSlug',
    fieldSchema: {
      type: String,
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['admins'],
      insertableBy: ['admins'],
      hidden: false,
      control: "text"
    }
  },

  {
    fieldName: 'canonicalPrevPostSlug',
    fieldSchema: {
      type: String,
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['admins'],
      insertableBy: ['admins'],
      hidden: false,
      control: "text"
    }
  },

  /**
    unlisted: If true, the post is not featured on the frontpage and is not featured on the user page. Only accessible via it's ID
  */

  {
    fieldName: 'unlisted',
    fieldSchema: {
      type: Boolean,
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['admins', 'sunshineRegiment'],
      insertableBy: ['admins', 'sunshineRegiment'],
      label: "Make only accessible via link",
      control: "checkbox",
      onInsert: (document, currentUser) => {
        if (!document.unlisted) {
          return false;
        }
      },
      onEdit: (modifier, post) => {
        if (modifier.$set.unlisted === null || modifier.$unset.unlisted) {
          return false;
        }
      }
    }
  },



  /**
    Drafts
  */
  {
    fieldName: "draft",
    fieldSchema: {
      label: 'Save to Drafts',
      type: Boolean,
      optional: true,
      defaultValue: false,
      viewableBy: ['members'],
      insertableBy: ['members'],
      editableBy: ['members'],
      hidden: true,
    }
  },


  /**
    meta: The post is published to the meta section of the page
  */

  {
    fieldName: 'meta',
    fieldSchema: {
      type: Boolean,
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['members'],
      insertableBy: ['members'],
      hidden: true,
      label: "Publish to meta",
      control: "checkbox",
      onInsert: (document, currentUser) => {
          if (!document.meta) {
            return false
          }
      },
      onEdit: (modifier, post) => {
        if (modifier.$set.meta === null || modifier.$unset.meta) {
          return false;
        }
      }
    }
  },

  {
    fieldName: 'hideFrontpageComments',
    fieldSchema: {
      type: Boolean,
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['admins'],
      insertableBy: ['admins'],
      control: 'checkbox'
    }
  },

  /**
    maxBaseScore: Highest baseScore this post ever had, used for RSS feed generation
  */

  {
    fieldName: 'maxBaseScore',
    fieldSchema: {
      type: Number,
      optional: true,
      viewableBy: ['guests'],
      hidden: true,
      onInsert: (document) => document.baseScore || 0,
    }
  },
  {
    fieldName: 'bannedUserIds',
    fieldSchema: {
      type: Array,
      viewableBy: ['members'],
      group: moderationGroup,
      insertableBy: (currentUser, document) => Users.canModeratePost(currentUser, document),
      editableBy: (currentUser, document) => Users.canModeratePost(currentUser, document),
      optional: true,
      label: "Users banned from commenting on this post",
      control: "UsersListEditor",
    }
  },
  {
    fieldName: 'bannedUserIds.$',
    fieldSchema: {
      type: String,
      optional: true
    }
  },
  {
    fieldName: 'commentsLocked',
    fieldSchema: {
      type: Boolean,
      viewableBy: ['guests'],
      group: moderationGroup,
      insertableBy: (currentUser, document) => Users.canCommentLock(currentUser, document),
      editableBy: (currentUser, document) => Users.canCommentLock(currentUser, document),
      optional: true,
      control: "checkbox",
    }
  },
  {
    fieldName: 'wordCount',
    fieldSchema: {
      type: Number,
      viewableBy: ['guests'],
      optional: true,
      hidden:true
    }
  },

  {
    fieldName: 'groupId',
    fieldSchema: {
      type: String,
      viewableBy: ['guests'],
      editableBy: ['sunshineRegiment'],
      insertableBy: ['members'],
      hidden: true,
      optional: true,
      resolveAs: {
        fieldName: 'group',
        addOriginalField: true,
        type: "Localgroup",
        resolver: (post, args, context) => {
          const group = context.Localgroups.findOne({_id: post.groupId});
          return Users.restrictViewableFields(context.currentUser, context.Localgroups, group);
        }
      }
    }
  },

  /*
    Event specific fields:
  */

  {
    fieldName: 'organizerIds',
    fieldSchema: {
      type: Array,
      viewableBy: ['guests'],
      insertableBy: ['members'],
      editableBy: ['members'],
      optional: true,
      hidden: true,
      control: "UsersListEditor",
      resolveAs: {
        fieldName: 'organizers',
        type: '[User]',
        resolver: (localEvent, args, context) => {
          return _.map(localEvent.organizerIds,
            (organizerId => {return context.Users.findOne({ _id: organizerId }, { fields: context.Users.getViewableFields(context.currentUser, context.Users) })})
          )
        },
        addOriginalField: true
      },
      group: formGroups.event,
    }
  },

  {
    fieldName: 'organizerIds.$',
    fieldSchema: {
      type: String,
      optional: true,
    }
  },

  {
    fieldName: 'groupId',
    fieldSchema: {
      type: String,
      viewableBy: ['guests'],
      editableBy: ['members'],
      insertableBy: ['members'],
      optional: true,
      hidden: true,
      group: formGroups.event,
      resolveAs: {
        fieldName: 'group',
        type: ['Localgroup'],
        resolver: (localEvent, args, context) => {
          return context.Localgroups.findOne({_id: localEvent.groupId}, {fields: context.Users.getViewableFields(context.currentUser, context.Localgroups)});
        },
        addOriginalField: true,
      }
    }
  },

  {
    fieldName: 'isEvent',
    fieldSchema: {
      type: Boolean,
      hidden: true,
      group: formGroups.event,
      viewableBy: ['guests'],
      editableBy: ['sunshineRegiment'],
      insertableBy: ['members'],
      optional: true
    }
  },

  {
    fieldName: 'reviewed',
    fieldSchema: {
      type: Boolean,
      optional: true,
      defaultValue: false,
      viewableBy: ['guests'],
      editableBy: ['sunshineRegiment', 'admins'],
      insertableBy: ['sunshineRegiment', 'admins'],
      control: 'checkbox'
    }
  },

  {
    fieldName: 'reviewForCuratedUserId',
    fieldSchema: {
      type: String,
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['sunshineRegiment', 'admins'],
      insertableBy: ['sunshineRegiment', 'admins']
    }
  },

  {
    fieldName: 'startTime',
    fieldSchema: {
      type: Date,
      hidden: (props) => !props.eventForm,
      viewableBy: ['guests'],
      editableBy: ['members'],
      insertableBy: ['members'],
      control: 'datetime',
      label: "Start Time",
      group: formGroups.event,
      optional: true,
    }
  },

  {
    fieldName: 'endTime',
    fieldSchema: {
      type: Date,
      hidden: (props) => !props.eventForm,
      viewableBy: ['guests'],
      editableBy: ['members'],
      insertableBy: ['members'],
      control: 'datetime',
      label: "End Time",
      group: formGroups.event,
      optional: true,
    }
  },

  {
    fieldName: 'mongoLocation',
    fieldSchema: {
      type: Object,
      viewableBy: ['guests'],
      insertableBy: ['members'],
      editableBy: ['members'],
      hidden: true,
      blackbox: true,
      optional: true
    }
  },

  {
    fieldName: 'googleLocation',
    fieldSchema: {
      type: Object,
      hidden: (props) => !props.eventForm,
      viewableBy: ['guests'],
      insertableBy: ['members'],
      editableBy: ['members'],
      label: "Group Location",
      control: 'LocationFormComponent',
      blackbox: true,
      group: formGroups.event,
      optional: true
    }
  },

  {
    fieldName: 'location',
    fieldSchema: {
      type: String,
      searchable: true,
      viewableBy: ['guests'],
      editableBy: ['members'],
      insertableBy: ['members'],
      hidden: true,
      optional: true
    }
  },

  {
    fieldName: 'contactInfo',
    fieldSchema: {
      type: String,
      hidden: (props) => !props.eventForm,
      viewableBy: ['guests'],
      insertableBy: ['members'],
      editableBy: ['members'],
      label: "Contact Info",
      control: "MuiTextField",
      optional: true,
      group: formGroups.event,
    }
  },

  {
    fieldName: 'facebookLink',
    fieldSchema: {
      type: String,
      hidden: (props) => !props.eventForm,
      viewableBy: ['guests'],
      insertableBy: ['members'],
      editableBy: ['members'],
      label: "Facebook Event",
      control: "MuiTextField",
      optional: true,
      group: formGroups.event,
    }
  },

  {
    fieldName: 'website',
    fieldSchema: {
      type: String,
      hidden: (props) => !props.eventForm,
      viewableBy: ['guests'],
      insertableBy: ['members'],
      editableBy: ['members'],
      control: "MuiTextField",
      optional: true,
      group: formGroups.event,
    }
  },

  {
    fieldName: 'types',
    fieldSchema: {
      type: Array,
      viewableBy: ['guests'],
      insertableBy: ['members'],
      editableBy: ['members'],
      hidden: (props) => !props.eventForm,
      control: 'MultiSelectButtons',
      label: "Group Type:",
      group: formGroups.event,
      optional: true,
      form: {
        options: [
          {value: "LW", color: "rgba(100, 169, 105, 0.9)", hoverColor: "rgba(100, 169, 105, 0.5)"},
          {value: "SSC", color: "rgba(100, 169, 105, 0.9)", hoverColor: "rgba(100, 169, 105, 0.5)"},
          {value: "EA", color: "rgba(100, 169, 105, 0.9)", hoverColor: "rgba(100, 169, 105, 0.5)"},
          {value: "MIRIx", color: "rgba(100, 169, 105, 0.9)", hoverColor: "rgba(100, 169, 105, 0.5)"}
          // Alternative colorization, keep around for now
          // {value: "SSC", color: "rgba(136, 172, 184, 0.9)", hoverColor: "rgba(136, 172, 184, 0.5)"},
          // {value: "EA", color: "rgba(29, 135, 156,0.5)", hoverColor: "rgba(29, 135, 156,0.5)"},
          // {value: "MIRIx", color: "rgba(225, 96, 1,0.6)", hoverColor: "rgba(225, 96, 1,0.3)"}
        ]
      },
    }
  },

  {
    fieldName: 'types.$',
    fieldSchema: {
      type: String,
      optional: true,
    }
  }
]);

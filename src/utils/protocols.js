
function addSchemas(config) {
  const types = config.types;
  const protocolUri = config.protocol;
  return Object.entries(types).reduce((result, [key, value]) => {
    if (value.dataFormats.some(format => format.match('json'))) {
      result[key] = types[key].schema = protocolUri + '/schemas/' + key;
    }
    return result;
  }, {})
}


const socialDefinition = {
  published: true,
  protocol: 'https://areweweb5yet.com/protocols/social',
  types: {
    "aggregators": {
      "dataFormats": ["application/json"]
    },
    "follow": {
      "dataFormats": ["application/json"]
    },
    "story": {
      "dataFormats": ["application/json"]
    },
    "comment": {
      "dataFormats": ["application/json"]
    },
    "thread": {
      "dataFormats": ["application/json"]
    },
    "reply": {
      "dataFormats": ["application/json"]
    },
    "media": {
      "dataFormats": ["image/gif", "image/png", "image/jpeg", "video/mp4"]
    }
  },
  structure: {
    aggregators: {},
    follow: {
      $role: true
    },
    story: {
      media: {
        $actions: [
          {
            who: 'author',
            of: 'story',
            can: ['create', 'update', 'delete']
          }
        ]
      },
      comment: {
        $actions: [
          {
            who: 'anyone',
            can: ['create', 'update', 'delete']
          },
          {
            who: 'author',
            of: 'story',
            can: ['co-delete']
          }
        ],
        media: {
          $actions: [
            {
              who: 'author',
              of: 'story/comment',
              can: ['create', 'update', 'delete']
            },
            {
              who: 'author',
              of: 'story',
              can: ['co-delete']
            }
          ]
        }
      }
    },
    thread: {
      media: {
        $actions: [
          {
            who: 'author',
            of: 'thread',
            can: ['create', 'update', 'delete']
          }
        ]
      },
      reply: {
        $actions: [
          {
            who: 'anyone',
            can: ['create', 'update', 'delete']
          }
        ],
        media: {
          $actions: [
            {
              who: 'author',
              of: 'thread/reply',
              can: ['create', 'update', 'delete']
            }
          ]
        }
      }
    }
  }
}

const profileDefinition = {
  published: true,
  protocol: "https://areweweb5yet.com/protocols/profile",
  types: {
    name: {
      dataFormats: ['application/json']
    },
    social: {
      dataFormats: ['application/json']
    },
    messaging: {
      dataFormats: ['application/json']
    },
    phone: {
      dataFormats: ['application/json']
    },
    address: {
      dataFormats: ['application/json']
    },
    career: {
      dataFormats: ['application/json']
    },
    payment: {
      dataFormats: ['application/json']
    },
    avatar: {
      dataFormats: ['image/gif', 'image/png', 'image/jpeg']
    },
    hero: {
      dataFormats: ['image/gif', 'image/png', 'image/jpeg']
    }
  },
  structure: {
    name: {},
    social: {},
    career: {},
    avatar: {},
    hero: {},
    messaging: {},
    address: {},
    phone: {},
    payment: {}
  }
}



export const profile = {
  uri: profileDefinition.protocol,
  schemas: addSchemas(profileDefinition),
  definition: profileDefinition
}

export const social = {
  uri: socialDefinition.protocol,
  schemas: addSchemas(socialDefinition),
  definition: socialDefinition
}

export const byUri = {
  [profileDefinition.protocol]: profile,
  [socialDefinition.protocol]: social,
}
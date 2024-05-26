
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

const credentialDefinition = {
  published: true,
  protocol: 'https://areweweb5yet.com/protocols/credential',
  types: {
    reverify: {
      dataFormats: ["application/json", "text/plain"]
    },
    providerData: {
      dataFormats: ["application/json"]
    },
    providerConfig: {
      dataFormats: ["application/json"]
    },
    raw_vc: {
      dataFormats: ["application/json", "text/plain"]
    },
    verified_name: {
      dataFormats: ["application/json", "text/plain"]
    }
  },
  structure: {
    reverify: {},
    verified_name: {},
    providerConfig: {
      $actions: [
        {
          who: 'author',
          of: 'credential',
          can: ['read', 'create', 'update', 'delete']
        }
      ]
    },
    providerData: {
      $actions: [
        {
          who: 'author',
          of: 'credential',
          can: ['read', 'create', 'update', 'delete']
        }
      ]
    },
    raw_vc: {
      $actions: [
        {
          who: 'author',
          of: 'credential',
          can: ['read', 'create', 'update', 'delete']
        },
        {
          who: 'anyone',
          of: 'credential',
          can: ['read']
        }
      ]
    },
    verified_name: {
      $actions: [
        {
          who: 'author',
          of: 'credential',
          can: ['read', 'create', 'update', 'delete']
        },
        {
          who: 'anyone',
          of: 'credential',
          can: ['read']
        }
      ]
    }
  }
}

const socialDefinition = {
  published: true,
  protocol: 'https://areweweb5yet.com/protocols/social',
  types: {
    "aggregators": {
      "dataFormats": ["application/json"]
    },
    "follows": {
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
    follows: {},
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
    credential: {
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
    avatar: {
      dataFormats: ['image/gif', 'image/png', 'image/jpeg']
    },
    hero: {
      dataFormats: ['image/gif', 'image/png', 'image/jpeg']
    }
  },
  structure: {
    name: {},
    credential: {},
    social: {},
    career: {},
    avatar: {},
    hero: {},
    messaging: {},
    address: {},
    phone: {}
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

export const credential = {
  uri: credentialDefinition.protocol,
  schemas: addSchemas(credentialDefinition),
  definition: credentialDefinition
}
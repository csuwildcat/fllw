
function addSchemas(config) {
  const types = config.types;
  const protocolUri = config.protocol;
  return Object.entries(types).reduce((result, [key, value]) => {
    if (value.dataFormats.length === 1) {
      result[key] = types[key].schema = protocolUri + '/schemas/' + key;
    }
    return result;
  }, {})
}

const anyoneCanQueryRead = [
  {
    who: 'anyone',
    can: 'read'
  }
]

const adminOrCreatorActions = [
  {
    who: 'author',
    of: 'community',
    can: 'write'
  },
  {
    who: 'author',
    of: 'community',
    can: 'delete'
  },
  {
    role: 'community/admin',
    can: 'write'
  },
  {
    role: 'community/admin',
    can: 'delete'
  },
  {
    role: 'community/admin',
    can: 'read'
  }
];

const adminOrCreatorAndMemberQueryRead = [
  {
    role: 'community/member',
    can: 'query'
  },
  {
    role: 'community/member',
    can: 'read'
  }
].concat(adminOrCreatorActions)

const memberActions = [{
  role: 'community/member',
  can: 'write'
},
{
  role: 'community/member',
  can: 'query'
},
{
  role: 'community/member',
  can: 'read'
},
{
  role: 'community/member',
  can: 'delete'
}]

const channelTemplate = {
  $actions: adminOrCreatorActions,
  message: {
    $actions: adminOrCreatorActions,
    media: {
      $actions: [
        {
          who: 'author',
          of: 'community/channel/message',
          can: 'write'
        },
        {
          role: 'community/member',
          can: 'query'
        },
        {
          role: 'community/member',
          can: 'read'
        }
      ]
    },
    reaction: {
      $actions: memberActions
    }
  }
};
const allMemberChannel = JSON.parse(JSON.stringify(channelTemplate));
      allMemberChannel.$actions = allMemberChannel.$actions.concat([
        {
          role: 'community/member',
          can: 'query'
        },
        {
          role: 'community/member',
          can: 'read'
        }
      ]);
      allMemberChannel.message.$actions = allMemberChannel.message.$actions.concat(memberActions)
      allMemberChannel.message.reaction.$actions = allMemberChannel.message.reaction.$actions.concat(memberActions)

const privateChannel = JSON.parse(JSON.stringify(channelTemplate))

privateChannel.participant = {
  $role: true,
  $actions: [
    {
      who: 'author',
      of: 'community/channel',
      can: 'write'
    },
    {
      who: 'author',
      of: 'community/channel',
      can: 'delete'
    },
    {
      role: 'community/channel/participant',
      can: 'write'
    },
    {
      role: 'community/channel/participant',
      can: 'delete'
    },
  ]
}

privateChannel.message.$actions = privateChannel.message.$actions.concat([{
  role: 'community/channel/participant',
  can: 'write'
},
{
  role: 'community/channel/participant',
  can: 'delete'
}])

const appDefinition = {
  published: true,
  protocol: 'https://slick.app',
  types: {
    invite: {
      dataFormats: ['application/json']
    },
    community: {
      dataFormats: ['application/json']
    },
    details: {
      dataFormats: ['application/json']
    },
    channel: {
      dataFormats: ['application/json']
    },
    message: {
      dataFormats: ['application/json']
    },
    image: {
      dataFormats: ['image/gif', 'image/png', 'image/jpeg']
    },
    logo: {
      dataFormats: ['image/gif', 'image/png', 'image/jpeg']
    },
    hero: {
      dataFormats: ['image/gif', 'image/png', 'image/jpeg']
    },
    media: {
      dataFormats: ['image/gif', 'image/png', 'image/jpeg', 'video/mp4']
    },
    reaction: {
      dataFormats: ['application/json']
    },
    admin: {
      dataFormats: ['application/json']
    },
    member: {
      dataFormats: ['application/json']
    },
    participant: {
      dataFormats: ['application/json']
    },
    task: {
      dataFormats: ['application/json']
    }
  },
  structure: {
    task: {},
    invite: {
      $actions: [
        {
          who: 'anyone',
          can: 'write'
        }
      ]
    },
    community: {
      $actions: adminOrCreatorAndMemberQueryRead,
      admin: {
        $contextRole: true,
        $actions: adminOrCreatorActions.concat([
          {
            role: 'community/member',
            can: 'query'
          },
          {
            role: 'community/member',
            can: 'read'
          }
        ])
      },
      member: {
        $contextRole: true,
        $actions: adminOrCreatorAndMemberQueryRead
      },
      details: {
        $actions: adminOrCreatorAndMemberQueryRead
      },
      logo: {
        $actions: adminOrCreatorAndMemberQueryRead.concat(anyoneCanQueryRead)
      },
      hero: {
        $actions: adminOrCreatorAndMemberQueryRead
      },
      channel: allMemberChannel,
      convo: {
        $actions: [
          {
            role: 'community/member',
            can: 'write'
          }
        ],
        message: {
          $actions: [
            {
              who: 'author',
              of: 'community/convo',
              can: 'write'
            },
            {
              who: 'recipient',
              of: 'community/convo/message',
              can: 'write'
            }
          ],
          media: {
            $actions: [
              {
                who: 'author',
                of: 'community/convo/message',
                can: 'write'
              }
            ]
          }
        }
      }
    }
  }
}

export const sync = {
  uri: appDefinition.protocol,
  schemas: addSchemas(appDefinition),
  definition: appDefinition
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
    avatar: {
      dataFormats: ['image/gif', 'image/png', 'image/jpeg']
    },
    hero: {
      dataFormats: ['image/gif', 'image/png', 'image/jpeg']
    }
  },
  structure: {
    social: {},
    avatar: {},
    hero: {},
    name: {},
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

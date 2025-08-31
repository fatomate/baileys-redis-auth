Failed to decrypt message with any known session...
Session error:Error: Bad MAC Error: Bad MAC
    at Object.verifyMAC (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/crypto.js:87:15)
    at SessionCipher.doDecryptWhisperMessage (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:250:16)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async SessionCipher.decryptWithSessions (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:147:29)
    at async 80758756622573.0 [as awaitable] (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:171:28)
    at async _asyncQueueExecutor (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/queue_job.js:20:29)
Session error:Error: Bad MAC Error: Bad MAC
    at Object.verifyMAC (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/crypto.js:87:15)
    at SessionCipher.doDecryptWhisperMessage (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:250:16)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async SessionCipher.decryptWithSessions (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:147:29)
    at async 80758756622573.0 [as awaitable] (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:171:28)
    at async _asyncQueueExecutor (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/queue_job.js:20:29)
{"level":50,"time":"2025-08-31T13:47:56.222Z","pid":559875,"hostname":"wabotv3-sql","key":{"remoteJid":"114194640801953@lid","fromMe":true,"id":"6BB1F3EAFC5F19583E513367C5FBD832"},"err":{"type":"SessionError","message":"No matching sessions found for message","stack":"SessionError: No matching sessions found for message\n    at SessionCipher.decryptWithSessions (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:161:15)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at async 80758756622573.0 [as awaitable] (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:171:28)\n    at async _asyncQueueExecutor (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/queue_job.js:20:29)","name":"SessionError"},"messageType":"msg","sender":"80758756622573@lid","author":"80758756622573@lid","isSessionRecordError":false,"msg":"failed to decrypt message"}
messages.upsert received for instance 6860DCA0E2819 : {
  "messages": [
    {
      "key": {
        "remoteJid": "114194640801953@lid",
        "fromMe": true,
        "id": "6BB1F3EAFC5F19583E513367C5FBD832"
      },
      "messageTimestamp": 1756648076,
      "pushName": "Wabot Demo",
      "broadcast": false,
      "status": 2,
      "messageStubType": 2,
      "messageStubParameters": [
        "No matching sessions found for message"
      ]
    }
  ],
  "type": "notify"
}
[LID] Pattern 2: FromMe=true, LID remoteJid (need reverse lookup)
Normalized @lid 114194640801953@lid to 60196953307@s.whatsapp.net
[LID] No cached mapping, attempting reverse lookup for 114194640801953@lid
[LidHandler] Attempting reverse lookup for LID: 114194640801953@lid
Would save message to MongoDB: 6BB1F3EAFC5F19583E513367C5FBD832
Emitted new_message_1 for message: 6BB1F3EAFC5F19583E513367C5FBD832 (type: text, media: pending)
[LID] Warning: Could not resolve LID 114194640801953@lid for fromMe message
[6860DCA0E2819] Health check passed
messages.upsert received for instance 6860DCA0E2819 : {
  "messages": [
    {
      "key": {
        "remoteJid": "60173577321@s.whatsapp.net",
        "fromMe": true,
        "id": "79691C9EF57AAB3E001091BF7A7A0943"
      },
      "messageTimestamp": 1756648081,
      "broadcast": false,
      "status": 2,
      "message": {
        "protocolMessage": {
          "type": "PEER_DATA_OPERATION_REQUEST_RESPONSE_MESSAGE",
          "peerDataOperationRequestResponseMessage": {
            "peerDataOperationRequestType": "PLACEHOLDER_MESSAGE_RESEND",
            "stanzaId": "3EB0A0DEE75C10168CF75A",
            "peerDataOperationResult": [
              {
                "mediaUploadResult": "SUCCESS",
                "placeholderMessageResendResponse": {
                  "webMessageInfoBytes": "CjkKEzExNDE5NDY0MDgwMTk1M0BsaWQQARogNkJCMUYzRUFGQzVGMTk1ODNFNTEzMzY3QzVGQkQ4MzISKQoCSHWaAiIaIJ4Uag48ioTycyT6NwwyeKnI9f7KX+fxOORd5VqDtkymGIul0cUGIAQwjKXRxQbCAiYKGjYwMTk2OTUzMzA3QHMud2hhdHNhcHAubmV0EAAYjKXRxQYgAMICHwoTMTE0MTk0NjQwODAxOTUzQGxpZBCMpdHFBhgAIACKAyCeFGoOPIqE8nMk+jcMMnipyPX+yl/n8TjkXeVag7ZMpogEAA=="
                }
              }
            ]
          }
        }
      }
    }
  ],
  "type": "notify"
}
Skipping protocolMessage for instance 6860DCA0E2819: 17
Failed to decrypt message with any known session...
Session error:Error: Bad MAC Error: Bad MAC
    at Object.verifyMAC (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/crypto.js:87:15)
    at SessionCipher.doDecryptWhisperMessage (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:250:16)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async SessionCipher.decryptWithSessions (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:147:29)
    at async 80758756622573.0 [as awaitable] (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:171:28)
    at async _asyncQueueExecutor (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/queue_job.js:20:29)
Session error:Error: Bad MAC Error: Bad MAC
    at Object.verifyMAC (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/crypto.js:87:15)
    at SessionCipher.doDecryptWhisperMessage (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:250:16)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async SessionCipher.decryptWithSessions (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:147:29)
    at async 80758756622573.0 [as awaitable] (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:171:28)
    at async _asyncQueueExecutor (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/queue_job.js:20:29)
{"level":50,"time":"2025-08-31T13:48:01.775Z","pid":559875,"hostname":"wabotv3-sql","key":{"remoteJid":"114194640801953@lid","fromMe":true,"id":"6BB1F3EAFC5F19583E513367C5FBD832"},"err":{"type":"SessionError","message":"No matching sessions found for message","stack":"SessionError: No matching sessions found for message\n    at SessionCipher.decryptWithSessions (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:161:15)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at async 80758756622573.0 [as awaitable] (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:171:28)\n    at async _asyncQueueExecutor (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/queue_job.js:20:29)","name":"SessionError"},"messageType":"msg","sender":"80758756622573@lid","author":"80758756622573@lid","isSessionRecordError":false,"msg":"failed to decrypt message"}
messages.upsert received for instance 6860DCA0E2819 : {
  "messages": [
    {
      "key": {
        "remoteJid": "114194640801953@lid",
        "fromMe": true,
        "id": "6BB1F3EAFC5F19583E513367C5FBD832"
      },
      "messageTimestamp": 1756648081,
      "pushName": "Wabot Demo",
      "broadcast": false,
      "status": 2,
      "messageStubType": 2,
      "messageStubParameters": [
        "No matching sessions found for message"
      ]
    }
  ],
  "type": "notify"
}
[LID] Pattern 2: FromMe=true, LID remoteJid (need reverse lookup)
Normalized @lid 114194640801953@lid to 60196953307@s.whatsapp.net
Skipping duplicate message: 6BB1F3EAFC5F19583E513367C5FBD832:stub
[LID] No cached mapping, attempting reverse lookup for 114194640801953@lid
[LidHandler] Attempting reverse lookup for LID: 114194640801953@lid
[LID] Warning: Could not resolve LID 114194640801953@lid for fromMe message
messages.upsert received for instance 6860DCA0E2819 : {
  "messages": [
    {
      "key": {
        "remoteJid": "114194640801953@lid",
        "fromMe": true,
        "id": "6BB1F3EAFC5F19583E513367C5FBD832"
      },
      "message": {
        "conversation": "Hu",
        "messageContextInfo": {
          "messageSecret": "nhRqDjyKhPJzJPo3DDJ4qcj1/spf5/E45F3lWoO2TKY="
        }
      },
      "messageTimestamp": "1756648075",
      "status": "READ",
      "messageC2STimestamp": "1756648076",
      "userReceipt": [
        {
          "userJid": "60196953307@s.whatsapp.net",
          "receiptTimestamp": "0",
          "readTimestamp": "1756648076",
          "playedTimestamp": "0"
        },
        {
          "userJid": "114194640801953@lid",
          "receiptTimestamp": "1756648076",
          "readTimestamp": "0",
          "playedTimestamp": "0"
        }
      ],
      "messageSecret": "nhRqDjyKhPJzJPo3DDJ4qcj1/spf5/E45F3lWoO2TKY=",
      "isMentionedInStatus": false
    }
  ],
  "type": "notify",
  "requestId": "3EB0A0DEE75C10168CF75A"
}
[LID] Pattern 2: FromMe=true, LID remoteJid (need reverse lookup)
[LID] No cached mapping, attempting reverse lookup for 114194640801953@lid
[LidHandler] Attempting reverse lookup for LID: 114194640801953@lid
Normalized @lid 114194640801953@lid to 60196953307@s.whatsapp.net
Skipping duplicate message: 6BB1F3EAFC5F19583E513367C5FBD832:stub
[LID] Warning: Could not resolve LID 114194640801953@lid for fromMe message
[2025-08-31 21:48:04] Memory (app): RSS=219.21 MB, Heap=120.96 MB/131.13 MB
Closing open session in favor of incoming prekey bundle
Closing session: SessionEntry {
  _chains: {
    'BewawEgfosQs1etgNFY6lWoLj+mugtW7S1XUMi/aDOc7': { chainKey: [Object], chainType: 2, messageKeys: [Object] },
    'BeZNhTy+dCi2DFmes/KEiuuwswVnOjHp+kMHipOi77wc': { chainKey: [Object], chainType: 2, messageKeys: [Object] },
    'BSX6iskvyGXY4ioeQwNqaLG8UlUc+cQMFOmNfbL6K9c/': { chainKey: [Object], chainType: 1, messageKeys: {} }
  },
  registrationId: 696358902,
  currentRatchet: {
    ephemeralKeyPair: {
      pubKey: <Buffer 05 25 fa 8a c9 2f c8 65 d8 e2 2a 1e 43 03 6a 68 b1 bc 52 55 1c f9 c4 0c 14 e9 8d 7d b2 fa 2b d7 3f>,
      privKey: <Buffer 88 38 ad d0 f5 2d 22 a4 e6 11 8a f7 9a 3c db 49 c7 fa 17 55 06 a8 d1 ad 02 7c c8 10 e0 6e 84 76>
    },
    lastRemoteEphemeralKey: <Buffer 05 e6 4d 85 3c be 74 28 b6 0c 59 9e b3 f2 84 8a eb b0 b3 05 67 3a 31 e9 fa 43 07 8a 93 a2 ef bc 1c>,
    previousCounter: 1,
    rootKey: <Buffer cb 20 1c 7a 6c f4 52 40 8a 93 7b bf d4 20 5a ba e0 81 fc b7 d4 22 af 37 2f e6 f9 fc cd 11 f7 7b>
  },
  indexInfo: {
    baseKey: <Buffer 05 67 27 60 0e cd 6d 2c 0b a3 1e c8 c7 62 94 7c 5f 0f 69 02 9b d7 01 44 91 ac 4f 64 a1 3a f1 de 15>,
    baseKeyType: 2,
    closed: -1,
    used: 1756648081761,
    created: 1756648064778,
    remoteIdentityKey: <Buffer 05 d5 12 2b 08 e3 20 d3 00 d0 d1 26 e7 72 5b 65 01 d1 2c be 81 df 07 36 64 d0 ca 55 94 68 7a fd 46>
  }
}
messages.upsert received for instance 6860DCA0E2819 : {
  "messages": [
    {
      "key": {
        "remoteJid": "60173577321@s.whatsapp.net",
        "fromMe": true,
        "id": "556D2EF8BB3485E961E482670E3CBA34"
      },
      "messageTimestamp": 1756648087,
      "broadcast": false,
      "status": 2,
      "verifiedBizName": "Wabot Demo",
      "message": {
        "protocolMessage": {
          "type": "PEER_DATA_OPERATION_REQUEST_RESPONSE_MESSAGE",
          "peerDataOperationRequestResponseMessage": {
            "peerDataOperationRequestType": "PLACEHOLDER_MESSAGE_RESEND",
            "stanzaId": "3EB03DBFA96509A6F3D75A",
            "peerDataOperationResult": [
              {
                "mediaUploadResult": "SUCCESS",
                "placeholderMessageResendResponse": {
                  "webMessageInfoBytes": "CjkKEzExNDE5NDY0MDgwMTk1M0BsaWQQARogNkJCMUYzRUFGQzVGMTk1ODNFNTEzMzY3QzVGQkQ4MzISKQoCSHWaAiIaIJ4Uag48ioTycyT6NwwyeKnI9f7KX+fxOORd5VqDtkymGIul0cUGIAQwjKXRxQbCAiYKGjYwMTk2OTUzMzA3QHMud2hhdHNhcHAubmV0EAAYjKXRxQYgAMICHwoTMTE0MTk0NjQwODAxOTUzQGxpZBCMpdHFBhgAIACKAyCeFGoOPIqE8nMk+jcMMnipyPX+yl/n8TjkXeVag7ZMpogEAA=="
                }
              }
            ]
          }
        }
      }
    }
  ],
  "type": "notify"
}
Skipping protocolMessage for instance 6860DCA0E2819: 17
{"level":50,"time":"2025-08-31T13:48:07.322Z","pid":559875,"hostname":"wabotv3-sql","key":{"remoteJid":"114194640801953@lid","fromMe":true,"id":"6BB1F3EAFC5F19583E513367C5FBD832"},"err":{"type":"PreKeyError","message":"Invalid PreKey ID","stack":"PreKeyError: Invalid PreKey ID\n    at SessionBuilder.initIncoming (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_builder.js:66:19)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at async 80758756622573.0 [as awaitable] (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:205:30)\n    at async _asyncQueueExecutor (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/queue_job.js:20:29)","name":"PreKeyError"},"messageType":"pkmsg","sender":"80758756622573@lid","author":"80758756622573@lid","isSessionRecordError":false,"msg":"failed to decrypt message"}
messages.upsert received for instance 6860DCA0E2819 : {
  "messages": [
    {
      "key": {
        "remoteJid": "114194640801953@lid",
        "fromMe": true,
        "id": "6BB1F3EAFC5F19583E513367C5FBD832"
      },
      "messageTimestamp": 1756648087,
      "pushName": "Wabot Demo",
      "broadcast": false,
      "status": 2,
      "verifiedBizName": "Wabot Demo",
      "messageStubType": 2,
      "messageStubParameters": [
        "Invalid PreKey ID"
      ]
    }
  ],
  "type": "notify"
}
[LID] Pattern 2: FromMe=true, LID remoteJid (need reverse lookup)
Normalized @lid 114194640801953@lid to 60196953307@s.whatsapp.net
Skipping duplicate message: 6BB1F3EAFC5F19583E513367C5FBD832:stub
[LID] No cached mapping, attempting reverse lookup for 114194640801953@lid
[LidHandler] Attempting reverse lookup for LID: 114194640801953@lid
[LID] Warning: Could not resolve LID 114194640801953@lid for fromMe message
messages.upsert received for instance 6860DCA0E2819 : {
  "messages": [
    {
      "key": {
        "remoteJid": "114194640801953@lid",
        "fromMe": true,
        "id": "6BB1F3EAFC5F19583E513367C5FBD832"
      },
      "message": {
        "conversation": "Hu",
        "messageContextInfo": {
          "messageSecret": "nhRqDjyKhPJzJPo3DDJ4qcj1/spf5/E45F3lWoO2TKY="
        }
      },
      "messageTimestamp": "1756648075",
      "status": "READ",
      "messageC2STimestamp": "1756648076",
      "userReceipt": [
        {
          "userJid": "60196953307@s.whatsapp.net",
          "receiptTimestamp": "0",
          "readTimestamp": "1756648076",
          "playedTimestamp": "0"
        },
        {
          "userJid": "114194640801953@lid",
          "receiptTimestamp": "1756648076",
          "readTimestamp": "0",
          "playedTimestamp": "0"
        }
      ],
      "messageSecret": "nhRqDjyKhPJzJPo3DDJ4qcj1/spf5/E45F3lWoO2TKY=",
      "isMentionedInStatus": false
    }
  ],
  "type": "notify",
  "requestId": "3EB03DBFA96509A6F3D75A"
}
[LID] Pattern 2: FromMe=true, LID remoteJid (need reverse lookup)
Normalized @lid 114194640801953@lid to 60196953307@s.whatsapp.net
Skipping duplicate message: 6BB1F3EAFC5F19583E513367C5FBD832:stub
[LID] No cached mapping, attempting reverse lookup for 114194640801953@lid
[LidHandler] Attempting reverse lookup for LID: 114194640801953@lid
[LID] Warning: Could not resolve LID 114194640801953@lid for fromMe message
Closing open session in favor of incoming prekey bundle
Closing session: SessionEntry {
  _chains: {
    'BdFGdzGyx5QQYeYtLGRbd8cyzKKfsT08WWlDu/7F9810': { chainKey: [Object], chainType: 2, messageKeys: {} },
    BWXVdIgl2EyvvQq87A0Vzkn8XPqx26qwmff0OpPkguYr: { chainKey: [Object], chainType: 1, messageKeys: {} }
  },
  registrationId: 696358902,
  currentRatchet: {
    ephemeralKeyPair: {
      pubKey: <Buffer 05 65 d5 74 88 25 d8 4c af bd 0a bc ec 0d 15 ce 49 fc 5c fa b1 db aa b0 99 f7 f4 3a 93 e4 82 e6 2b>,
      privKey: <Buffer c0 c9 7c 3f ae 29 c9 a6 6a 93 c0 af eb 37 64 54 94 7a 86 72 47 11 15 df 77 75 2c 19 bc ed 24 53>
    },
    lastRemoteEphemeralKey: <Buffer 05 d1 46 77 31 b2 c7 94 10 61 e6 2d 2c 64 5b 77 c7 32 cc a2 9f b1 3d 3c 59 69 43 bb fe c5 f7 cd 74>,
    previousCounter: 0,
    rootKey: <Buffer 32 2f bc c8 7b 19 ee a8 37 55 4d a4 d1 53 c4 ca 74 0a e2 ac 6b 42 ae ee e2 a8 e1 9e 0e 14 49 77>
  },
  indexInfo: {
    baseKey: <Buffer 05 a9 3f 38 50 d9 63 87 df 5b 41 cc c2 cb c2 9b 6a a0 7f a1 18 26 e0 cf d2 f8 32 05 40 2a ea 7e 38>,
    baseKeyType: 2,
    closed: -1,
    used: 1756648065431,
    created: 1756648065431,
    remoteIdentityKey: <Buffer 05 d5 12 2b 08 e3 20 d3 00 d0 d1 26 e7 72 5b 65 01 d1 2c be 81 df 07 36 64 d0 ca 55 94 68 7a fd 46>
  }
}
messages.upsert received for instance 6860DCA0E2819 : {
  "messages": [
    {
      "key": {
        "remoteJid": "114194640801953@lid",
        "fromMe": true,
        "id": "6BB1F3EAFC5F19583E513367C5FBD832"
      },
      "messageTimestamp": 1756648087,
      "pushName": "Wabot Demo",
      "broadcast": false,
      "status": 2,
      "verifiedBizName": "Wabot Demo",
      "message": {
        "conversation": "Hu"
      }
    }
  ],
  "type": "notify"
}
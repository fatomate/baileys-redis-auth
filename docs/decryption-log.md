messages.upsert received for instance 6860DCA0E2819 : {
  "messages": [
    {
      "key": {
        "remoteJid": "60196953307@s.whatsapp.net",
        "fromMe": false,
        "id": "3A1091966F18D6404E50",
        "senderLid": "114194640801953@lid"
      },
      "messageTimestamp": 1756650006,
      "pushName": "Firdaus Azizi",
      "broadcast": false,
      "message": {
        "conversation": "botcheck",
        "messageContextInfo": {
          "deviceListMetadata": {
            "senderKeyHash": "UbAAeMdA5GR/wQ==",
            "senderTimestamp": "1756448751",
            "recipientKeyHash": "XX4HJL1p1bxFHQ==",
            "recipientTimestamp": "1756648009"
          },
          "deviceListMetadataVersion": 2,
          "messageSecret": "lP5yn5ufmXnRKXQ4hNklB3UCbsOJbiy09dGpRIAMgSs="
        }
      }
    }
  ],
  "type": "notify"
}
[LID] Pattern 3: FromMe=false, only senderLid (waiting for phone discovery)
[LID Handler] Stored mapping: 114194640801953@lid <-> 60196953307@s.whatsapp.net for session 6860DCA0E2819
[registerLidMapping] Successfully registered mapping: 114194640801953@lid <-> 60196953307@s.whatsapp.net for session 6860DCA0E2819
chatMessage is botcheck
Would save message to MongoDB: 3A1091966F18D6404E50
Emitted new_message_1 for message: 3A1091966F18D6404E50 (type: text, media: pending)
Contacts update received for instance id 6860DCA0E2819
Contacts Updated: [
  {
    "id": "60196953307@s.whatsapp.net",
    "notify": "Firdaus Azizi"
  }
] for instance id 6860DCA0E2819
Sending text message to 60196953307@s.whatsapp.net from instance id 6860DCA0E2819
chatbot connection is active for instance 6860DCA0E2819
Updated ai_credit_count for team 1 to 387
next_update for team 1 is less than currentTime, updating next_update to 1756650037
Updating sp_whatsapp_stats for team 1
messages.upsert received for instance 6860DCA0E2819 : {
  "messages": [
    {
      "key": {
        "remoteJid": "60196953307@s.whatsapp.net",
        "fromMe": true,
        "id": "3EB0ACB289301E13CACA60"
      },
      "message": {
        "extendedTextMessage": {
          "text": "_chatbot connection is active_"
        }
      },
      "messageTimestamp": "1756650006",
      "status": "PENDING"
    }
  ],
  "type": "append"
}
Would save message to MongoDB: 3EB0ACB289301E13CACA60
Emitted new_message_1 for message: 3EB0ACB289301E13CACA60 (type: text, media: pending)
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
Session error:Error: Bad MAC Error: Bad MAC
    at Object.verifyMAC (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/crypto.js:87:15)
    at SessionCipher.doDecryptWhisperMessage (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:250:16)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async SessionCipher.decryptWithSessions (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:147:29)
    at async 80758756622573.0 [as awaitable] (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:171:28)
    at async _asyncQueueExecutor (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/queue_job.js:20:29)
{"level":50,"time":"2025-08-31T14:20:16.193Z","pid":564699,"hostname":"wabotv3-sql","key":{"remoteJid":"114194640801953@lid","fromMe":true,"id":"9B97CACA15870237D0E72D082FCCE7ED"},"err":{"type":"SessionError","message":"No matching sessions found for message","stack":"SessionError: No matching sessions found for message\n    at SessionCipher.decryptWithSessions (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:161:15)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at async 80758756622573.0 [as awaitable] (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:171:28)\n    at async _asyncQueueExecutor (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/queue_job.js:20:29)","name":"SessionError"},"messageType":"msg","sender":"80758756622573@lid","author":"80758756622573@lid","isSessionRecordError":false,"msg":"failed to decrypt message"}
messages.upsert received for instance 6860DCA0E2819 : {
  "messages": [
    {
      "key": {
        "remoteJid": "114194640801953@lid",
        "fromMe": true,
        "id": "9B97CACA15870237D0E72D082FCCE7ED"
      },
      "messageTimestamp": 1756650016,
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
Would save message to MongoDB: 9B97CACA15870237D0E72D082FCCE7ED
Emitted new_message_1 for message: 9B97CACA15870237D0E72D082FCCE7ED (type: text, media: pending)
[LID] No cached mapping, attempting reverse lookup for 114194640801953@lid
[LidHandler] Attempting reverse lookup for LID: 114194640801953@lid
[LID] Warning: Could not resolve LID 114194640801953@lid for fromMe message
messages.upsert received for instance 6860DCA0E2819 : {
  "messages": [
    {
      "key": {
        "remoteJid": "60173577321@s.whatsapp.net",
        "fromMe": true,
        "id": "7D5F69AE984003F31258D8D78EE1F73A"
      },
      "messageTimestamp": 1756650021,
      "broadcast": false,
      "status": 2,
      "message": {
        "protocolMessage": {
          "type": "PEER_DATA_OPERATION_REQUEST_RESPONSE_MESSAGE",
          "peerDataOperationRequestResponseMessage": {
            "peerDataOperationRequestType": "PLACEHOLDER_MESSAGE_RESEND",
            "stanzaId": "3EB0903223EB067A3FC0D4",
            "peerDataOperationResult": [
              {
                "mediaUploadResult": "SUCCESS",
                "placeholderMessageResendResponse": {
                  "webMessageInfoBytes": "CjkKEzExNDE5NDY0MDgwMTk1M0BsaWQQARogOUI5N0NBQ0ExNTg3MDIzN0QwRTcyRDA4MkZDQ0U3RUQSKwoESHVodZoCIhoghL5nSgA3pKNYmJ5rOw0EF4Z0UqKTbWAttbkrtO9rvIYYn7TRxQYgBDCgtNHFBsICJgoaNjAxOTY5NTMzMDdAcy53aGF0c2FwcC5uZXQQABigtNHFBiAAwgIfChMxMTQxOTQ2NDA4MDE5NTNAbGlkEKC00cUGGAAgAIoDIIS+Z0oAN6SjWJieazsNBBeGdFKik21gLbW5K7Tva7yGiAQA"
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
Session error:Error: Bad MAC Error: Bad MAC
    at Object.verifyMAC (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/crypto.js:87:15)
    at SessionCipher.doDecryptWhisperMessage (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:250:16)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async SessionCipher.decryptWithSessions (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:147:29)
    at async 80758756622573.0 [as awaitable] (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:171:28)
    at async _asyncQueueExecutor (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/queue_job.js:20:29)
{"level":50,"time":"2025-08-31T14:20:21.834Z","pid":564699,"hostname":"wabotv3-sql","key":{"remoteJid":"114194640801953@lid","fromMe":true,"id":"9B97CACA15870237D0E72D082FCCE7ED"},"err":{"type":"SessionError","message":"No matching sessions found for message","stack":"SessionError: No matching sessions found for message\n    at SessionCipher.decryptWithSessions (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:161:15)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at async 80758756622573.0 [as awaitable] (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:171:28)\n    at async _asyncQueueExecutor (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/queue_job.js:20:29)","name":"SessionError"},"messageType":"msg","sender":"80758756622573@lid","author":"80758756622573@lid","isSessionRecordError":false,"msg":"failed to decrypt message"}
messages.upsert received for instance 6860DCA0E2819 : {
  "messages": [
    {
      "key": {
        "remoteJid": "114194640801953@lid",
        "fromMe": true,
        "id": "9B97CACA15870237D0E72D082FCCE7ED"
      },
      "messageTimestamp": 1756650021,
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
Skipping duplicate message: 9B97CACA15870237D0E72D082FCCE7ED:stub
[LID] No cached mapping, attempting reverse lookup for 114194640801953@lid
[LidHandler] Attempting reverse lookup for LID: 114194640801953@lid
[LID] Warning: Could not resolve LID 114194640801953@lid for fromMe message
messages.upsert received for instance 6860DCA0E2819 : {
  "messages": [
    {
      "key": {
        "remoteJid": "114194640801953@lid",
        "fromMe": true,
        "id": "9B97CACA15870237D0E72D082FCCE7ED"
      },
      "message": {
        "conversation": "Huhu",
        "messageContextInfo": {
          "messageSecret": "hL5nSgA3pKNYmJ5rOw0EF4Z0UqKTbWAttbkrtO9rvIY="
        }
      },
      "messageTimestamp": "1756650015",
      "status": "READ",
      "messageC2STimestamp": "1756650016",
      "userReceipt": [
        {
          "userJid": "60196953307@s.whatsapp.net",
          "receiptTimestamp": "0",
          "readTimestamp": "1756650016",
          "playedTimestamp": "0"
        },
        {
          "userJid": "114194640801953@lid",
          "receiptTimestamp": "1756650016",
          "readTimestamp": "0",
          "playedTimestamp": "0"
        }
      ],
      "messageSecret": "hL5nSgA3pKNYmJ5rOw0EF4Z0UqKTbWAttbkrtO9rvIY=",
      "isMentionedInStatus": false
    }
  ],
  "type": "notify",
  "requestId": "3EB0903223EB067A3FC0D4"
}
[LID] Pattern 2: FromMe=true, LID remoteJid (need reverse lookup)
Normalized @lid 114194640801953@lid to 60196953307@s.whatsapp.net
Skipping duplicate message: 9B97CACA15870237D0E72D082FCCE7ED:stub
[LID] No cached mapping, attempting reverse lookup for 114194640801953@lid
[LidHandler] Attempting reverse lookup for LID: 114194640801953@lid
[LID] Warning: Could not resolve LID 114194640801953@lid for fromMe message
[2025-08-31 22:20:25] Memory (app): RSS=200.20 MB, Heap=118.15 MB/126.38 MB
Closing open session in favor of incoming prekey bundle
Closing session: SessionEntry {
  _chains: {
    'BUs0cEuEuqL7AKIPP4YPRz/R/BLnTvs+btDplpBuftsj': { chainKey: [Object], chainType: 2, messageKeys: [Object] },
    'BQSfcgSEcVzHSU34voPniGPC6s2gpLrhjVBILmxtw+gb': { chainKey: [Object], chainType: 2, messageKeys: [Object] },
    BRZyJsmI1SfYV6Yx9pAs63tiwu3DcDimrDR9KGy3FldB: { chainKey: [Object], chainType: 1, messageKeys: {} }
  },
  registrationId: 696358902,
  currentRatchet: {
    ephemeralKeyPair: {
      pubKey: <Buffer 05 16 72 26 c9 88 d5 27 d8 57 a6 31 f6 90 2c eb 7b 62 c2 ed c3 70 38 a6 ac 34 7d 28 6c b7 16 57 41>,
      privKey: <Buffer b0 20 4c ac a2 f7 ce b8 63 5d 34 d9 cb b3 d2 57 1b eb 99 24 87 2f de 85 52 37 fb 8c 84 b6 5c 79>
    },
    lastRemoteEphemeralKey: <Buffer 05 04 9f 72 04 84 71 5c c7 49 4d f8 be 83 e7 88 63 c2 ea cd a0 a4 ba e1 8d 50 48 2e 6c 6d c3 e8 1b>,
    previousCounter: 1,
    rootKey: <Buffer 60 35 89 f7 7f 13 43 9f 9f 3c 99 40 d0 d3 e3 6a f0 8e 83 fe b7 6d 99 48 db 5b 03 73 33 ec a3 12>
  },
  indexInfo: {
    baseKey: <Buffer 05 80 cb 90 f4 31 1d a7 9b 5e c8 02 5e da 7f 25 e1 54 9b c3 f9 ba 67 ab 1c ba 3f 3e 8d 23 c7 5d 1f>,
    baseKeyType: 2,
    closed: -1,
    used: 1756650021777,
    created: 1756648087288,
    remoteIdentityKey: <Buffer 05 d5 12 2b 08 e3 20 d3 00 d0 d1 26 e7 72 5b 65 01 d1 2c be 81 df 07 36 64 d0 ca 55 94 68 7a fd 46>
  }
}
messages.upsert received for instance 6860DCA0E2819 : {
  "messages": [
    {
      "key": {
        "remoteJid": "60173577321@s.whatsapp.net",
        "fromMe": true,
        "id": "4BE2D85D8EC90863D7952EE2DC15D69F"
      },
      "messageTimestamp": 1756650027,
      "broadcast": false,
      "status": 2,
      "verifiedBizName": "Wabot Demo",
      "message": {
        "protocolMessage": {
          "type": "PEER_DATA_OPERATION_REQUEST_RESPONSE_MESSAGE",
          "peerDataOperationRequestResponseMessage": {
            "peerDataOperationRequestType": "PLACEHOLDER_MESSAGE_RESEND",
            "stanzaId": "3EB03684527BE92B7E8A72",
            "peerDataOperationResult": [
              {
                "mediaUploadResult": "SUCCESS",
                "placeholderMessageResendResponse": {
                  "webMessageInfoBytes": "CjkKEzExNDE5NDY0MDgwMTk1M0BsaWQQARogOUI5N0NBQ0ExNTg3MDIzN0QwRTcyRDA4MkZDQ0U3RUQSKwoESHVodZoCIhoghL5nSgA3pKNYmJ5rOw0EF4Z0UqKTbWAttbkrtO9rvIYYn7TRxQYgBDCgtNHFBsICJgoaNjAxOTY5NTMzMDdAcy53aGF0c2FwcC5uZXQQABigtNHFBiAAwgIfChMxMTQxOTQ2NDA4MDE5NTNAbGlkEKC00cUGGAAgAIoDIIS+Z0oAN6SjWJieazsNBBeGdFKik21gLbW5K7Tva7yGiAQA"
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
{"level":50,"time":"2025-08-31T14:20:27.428Z","pid":564699,"hostname":"wabotv3-sql","key":{"remoteJid":"114194640801953@lid","fromMe":true,"id":"9B97CACA15870237D0E72D082FCCE7ED"},"err":{"type":"PreKeyError","message":"Invalid PreKey ID","stack":"PreKeyError: Invalid PreKey ID\n    at SessionBuilder.initIncoming (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_builder.js:66:19)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at async 80758756622573.0 [as awaitable] (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:205:30)\n    at async _asyncQueueExecutor (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/queue_job.js:20:29)","name":"PreKeyError"},"messageType":"pkmsg","sender":"80758756622573@lid","author":"80758756622573@lid","isSessionRecordError":false,"msg":"failed to decrypt message"}
messages.upsert received for instance 6860DCA0E2819 : {
  "messages": [
    {
      "key": {
        "remoteJid": "114194640801953@lid",
        "fromMe": true,
        "id": "9B97CACA15870237D0E72D082FCCE7ED"
      },
      "messageTimestamp": 1756650027,
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
Skipping duplicate message: 9B97CACA15870237D0E72D082FCCE7ED:stub
[LID] No cached mapping, attempting reverse lookup for 114194640801953@lid
[LidHandler] Attempting reverse lookup for LID: 114194640801953@lid
[LID] Warning: Could not resolve LID 114194640801953@lid for fromMe message
messages.upsert received for instance 6860DCA0E2819 : {
  "messages": [
    {
      "key": {
        "remoteJid": "114194640801953@lid",
        "fromMe": true,
        "id": "9B97CACA15870237D0E72D082FCCE7ED"
      },
      "message": {
        "conversation": "Huhu",
        "messageContextInfo": {
          "messageSecret": "hL5nSgA3pKNYmJ5rOw0EF4Z0UqKTbWAttbkrtO9rvIY="
        }
      },
      "messageTimestamp": "1756650015",
      "status": "READ",
      "messageC2STimestamp": "1756650016",
      "userReceipt": [
        {
          "userJid": "60196953307@s.whatsapp.net",
          "receiptTimestamp": "0",
          "readTimestamp": "1756650016",
          "playedTimestamp": "0"
        },
        {
          "userJid": "114194640801953@lid",
          "receiptTimestamp": "1756650016",
          "readTimestamp": "0",
          "playedTimestamp": "0"
        }
      ],
      "messageSecret": "hL5nSgA3pKNYmJ5rOw0EF4Z0UqKTbWAttbkrtO9rvIY=",
      "isMentionedInStatus": false
    }
  ],
  "type": "notify",
  "requestId": "3EB03684527BE92B7E8A72"
}
[LID] Pattern 2: FromMe=true, LID remoteJid (need reverse lookup)
Normalized @lid 114194640801953@lid to 60196953307@s.whatsapp.net
Skipping duplicate message: 9B97CACA15870237D0E72D082FCCE7ED:stub
[LID] No cached mapping, attempting reverse lookup for 114194640801953@lid
[LidHandler] Attempting reverse lookup for LID: 114194640801953@lid
[LID] Warning: Could not resolve LID 114194640801953@lid for fromMe message
Closing open session in favor of incoming prekey bundle
Closing session: SessionEntry {
  _chains: {
    'BanBiNWf+4l+RQBuFUGL0OfF+2bDWjk1VB/fxa7YX8oC': { chainKey: [Object], chainType: 2, messageKeys: {} },
    'Bcig18so6jxptLnn+I93psfAtv3W7DW9FIFA0fTtFatb': { chainKey: [Object], chainType: 1, messageKeys: {} }
  },
  registrationId: 696358902,
  currentRatchet: {
    ephemeralKeyPair: {
      pubKey: <Buffer 05 c8 a0 d7 cb 28 ea 3c 69 b4 b9 e7 f8 8f 77 a6 c7 c0 b6 fd d6 ec 35 bd 14 81 40 d1 f4 ed 15 ab 5b>,
      privKey: <Buffer d0 de a6 b5 ea e3 e1 dd f6 1b f9 90 9a 6b 39 46 a7 e4 92 11 66 a7 9f 34 56 86 f4 b1 10 11 55 6e>
    },
    lastRemoteEphemeralKey: <Buffer 05 a9 c1 88 d5 9f fb 89 7e 45 00 6e 15 41 8b d0 e7 c5 fb 66 c3 5a 39 35 54 1f df c5 ae d8 5f ca 02>,
    previousCounter: 0,
    rootKey: <Buffer f7 2d 71 36 c8 3c cb 3f 1b 33 0f 76 af 2e 55 ea 6d 91 4b 3a 0e 7e ee 47 3b 72 a3 75 60 72 57 3c>
  },
  indexInfo: {
    baseKey: <Buffer 05 a2 98 5d a6 b9 41 c3 9c 79 5e 90 e9 40 6f d2 f4 6d 89 ef e2 be 94 b1 b6 db b0 c5 c9 22 9a 3c 73>,
    baseKeyType: 2,
    closed: -1,
    used: 1756648087856,
    created: 1756648087856,
    remoteIdentityKey: <Buffer 05 d5 12 2b 08 e3 20 d3 00 d0 d1 26 e7 72 5b 65 01 d1 2c be 81 df 07 36 64 d0 ca 55 94 68 7a fd 46>
  }
}
messages.upsert received for instance 6860DCA0E2819 : {
  "messages": [
    {
      "key": {
        "remoteJid": "114194640801953@lid",
        "fromMe": true,
        "id": "9B97CACA15870237D0E72D082FCCE7ED"
      },
      "messageTimestamp": 1756650027,
      "pushName": "Wabot Demo",
      "broadcast": false,
      "status": 2,
      "verifiedBizName": "Wabot Demo",
      "message": {
        "conversation": "Huhu"
      }
    }
  ],
  "type": "notify"
}
messages.upsert received for instance 6860DCA0E2819 : {
  "messages": [
    {
      "key": {
        "remoteJid": "60196953307@s.whatsapp.net",
        "fromMe": false,
        "id": "3A39935C8D1738F00209",
        "senderLid": "114194640801953@lid"
      },
      "messageTimestamp": 1756651176,
      "pushName": "Firdaus Azizi",
      "broadcast": false,
      "message": {
        "conversation": "Botcheck",
        "messageContextInfo": {
          "deviceListMetadata": {
            "senderKeyHash": "UbAAeMdA5GR/wQ==",
            "senderTimestamp": "1756448751",
            "recipientKeyHash": "XX4HJL1p1bxFHQ==",
            "recipientTimestamp": "1756648009"
          },
          "deviceListMetadataVersion": 2,
          "messageSecret": "2kXAdzuMGQcrQBl1XEyUk4edwfPMQe6JHRCv0F8dzKM="
        }
      }
    }
  ],
  "type": "notify"
}
[LID] Pattern 3: FromMe=false, only senderLid (waiting for phone discovery)
[LID Handler] Stored mapping: 114194640801953@lid <-> 60196953307@s.whatsapp.net for session 6860DCA0E2819
[registerLidMapping] Checking session keys with base: baileys:auth:6860DCA0E2819
[registerLidMapping] Checking for phone session key: baileys:auth:6860DCA0E2819:session-60196953307@s.whatsapp.net
[registerLidMapping] No phone session key found: baileys:auth:6860DCA0E2819:session-60196953307@s.whatsapp.net
[registerLidMapping] Checking for LID session key: baileys:auth:6860DCA0E2819:session-114194640801953@lid
[registerLidMapping] No LID session key found: baileys:auth:6860DCA0E2819:session-114194640801953@lid
[registerLidMapping] Successfully registered mapping: 114194640801953@lid <-> 60196953307@s.whatsapp.net for session 6860DCA0E2819
chatMessage is botcheck
Would save message to MongoDB: 3A39935C8D1738F00209
Emitted new_message_1 for message: 3A39935C8D1738F00209 (type: text, media: pending)
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
next_update for team 1 is less than currentTime, updating next_update to 1756651206
Updating sp_whatsapp_stats for team 1
messages.upsert received for instance 6860DCA0E2819 : {
  "messages": [
    {
      "key": {
        "remoteJid": "60196953307@s.whatsapp.net",
        "fromMe": true,
        "id": "3EB05272103BF305201164"
      },
      "message": {
        "extendedTextMessage": {
          "text": "_chatbot connection is active_"
        }
      },
      "messageTimestamp": "1756651176",
      "status": "PENDING"
    }
  ],
  "type": "append"
}
Would save message to MongoDB: 3EB05272103BF305201164
Emitted new_message_1 for message: 3EB05272103BF305201164 (type: text, media: pending)
[2025-08-31 22:39:44] Memory (app): RSS=192.48 MB, Heap=114.77 MB/121.63 MB
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
{"level":50,"time":"2025-08-31T14:39:56.325Z","pid":567355,"hostname":"wabotv3-sql","key":{"remoteJid":"114194640801953@lid","fromMe":true,"id":"5039831BE3DAE5C0EE183018363B5557"},"err":{"type":"SessionError","message":"No matching sessions found for message","stack":"SessionError: No matching sessions found for message\n    at SessionCipher.decryptWithSessions (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:161:15)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at async 80758756622573.0 [as awaitable] (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:171:28)\n    at async _asyncQueueExecutor (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/queue_job.js:20:29)","name":"SessionError"},"messageType":"msg","sender":"80758756622573@lid","author":"80758756622573@lid","isSessionRecordError":false,"msg":"failed to decrypt message"}
messages.upsert received for instance 6860DCA0E2819 : {
  "messages": [
    {
      "key": {
        "remoteJid": "114194640801953@lid",
        "fromMe": true,
        "id": "5039831BE3DAE5C0EE183018363B5557"
      },
      "messageTimestamp": 1756651196,
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
Would save message to MongoDB: 5039831BE3DAE5C0EE183018363B5557
Emitted new_message_1 for message: 5039831BE3DAE5C0EE183018363B5557 (type: text, media: pending)
[LID] Warning: Could not resolve LID 114194640801953@lid for fromMe message
Checking for stale campaigns
Checking for stale campaigns...
No campaigns in the processing set.
Checking for stuck processing campaigns in database...
No stuck processing campaigns found in database.
messages.upsert received for instance 6860DCA0E2819 : {
  "messages": [
    {
      "key": {
        "remoteJid": "60173577321@s.whatsapp.net",
        "fromMe": true,
        "id": "F23E4D9FDED4E7A955653518FF341186"
      },
      "messageTimestamp": 1756651203,
      "broadcast": false,
      "status": 2,
      "message": {
        "protocolMessage": {
          "type": "PEER_DATA_OPERATION_REQUEST_RESPONSE_MESSAGE",
          "peerDataOperationRequestResponseMessage": {
            "peerDataOperationRequestType": "PLACEHOLDER_MESSAGE_RESEND",
            "stanzaId": "3EB0F0BBA33325DAAB0228",
            "peerDataOperationResult": [
              {
                "mediaUploadResult": "SUCCESS",
                "placeholderMessageResendResponse": {
                  "webMessageInfoBytes": "CjkKEzExNDE5NDY0MDgwMTk1M0BsaWQQARogNTAzOTgzMUJFM0RBRTVDMEVFMTgzMDE4MzYzQjU1NTcSKQoCSHWaAiIaIKPPzCI3Ef6eN4CD9LcB/+wXtnQElbRHQsQJR8H/k32zGLy90cUGIATCAiYKGjYwMTk2OTUzMzA3QHMud2hhdHNhcHAubmV0EAAYvL3RxQYgAMICHwoTMTE0MTk0NjQwODAxOTUzQGxpZBC8vdHFBhgAIACKAyCjz8wiNxH+njeAg/S3Af/sF7Z0BJW0R0LECUfB/5N9s4gEAA=="
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
Failed to decrypt message with any known session...
Session error:Error: Bad MAC Error: Bad MAC
    at Object.verifyMAC (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/crypto.js:87:15)
    at SessionCipher.doDecryptWhisperMessage (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:250:16)
    at async SessionCipher.decryptWithSessions (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:147:29)
    at async 80758756622573.0 [as awaitable] (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:171:28)
    at async _asyncQueueExecutor (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/queue_job.js:20:29)
Session error:Error: Bad MAC Error: Bad MAC
    at Object.verifyMAC (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/crypto.js:87:15)
    at SessionCipher.doDecryptWhisperMessage (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:250:16)
    at async SessionCipher.decryptWithSessions (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:147:29)
    at async 80758756622573.0 [as awaitable] (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:171:28)
    at async _asyncQueueExecutor (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/queue_job.js:20:29)
Session error:Error: Bad MAC Error: Bad MAC
    at Object.verifyMAC (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/crypto.js:87:15)
    at SessionCipher.doDecryptWhisperMessage (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:250:16)
    at async SessionCipher.decryptWithSessions (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:147:29)
    at async 80758756622573.0 [as awaitable] (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:171:28)
    at async _asyncQueueExecutor (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/queue_job.js:20:29)
Session error:Error: Bad MAC Error: Bad MAC
    at Object.verifyMAC (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/crypto.js:87:15)
    at SessionCipher.doDecryptWhisperMessage (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:250:16)
    at async SessionCipher.decryptWithSessions (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:147:29)
    at async 80758756622573.0 [as awaitable] (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:171:28)
    at async _asyncQueueExecutor (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/queue_job.js:20:29)
Session error:Error: Bad MAC Error: Bad MAC
    at Object.verifyMAC (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/crypto.js:87:15)
    at SessionCipher.doDecryptWhisperMessage (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:250:16)
    at async SessionCipher.decryptWithSessions (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:147:29)
    at async 80758756622573.0 [as awaitable] (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:171:28)
    at async _asyncQueueExecutor (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/queue_job.js:20:29)
{"level":50,"time":"2025-08-31T14:40:03.154Z","pid":567355,"hostname":"wabotv3-sql","key":{"remoteJid":"114194640801953@lid","fromMe":true,"id":"5039831BE3DAE5C0EE183018363B5557"},"err":{"type":"SessionError","message":"No matching sessions found for message","stack":"SessionError: No matching sessions found for message\n    at SessionCipher.decryptWithSessions (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:161:15)\n    at async 80758756622573.0 [as awaitable] (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:171:28)\n    at async _asyncQueueExecutor (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/queue_job.js:20:29)","name":"SessionError"},"messageType":"msg","sender":"80758756622573@lid","author":"80758756622573@lid","isSessionRecordError":false,"msg":"failed to decrypt message"}
messages.upsert received for instance 6860DCA0E2819 : {
  "messages": [
    {
      "key": {
        "remoteJid": "114194640801953@lid",
        "fromMe": true,
        "id": "5039831BE3DAE5C0EE183018363B5557"
      },
      "messageTimestamp": 1756651203,
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
Skipping protocolMessage for instance 6860DCA0E2819: 17
Normalized @lid 114194640801953@lid to 60196953307@s.whatsapp.net
Skipping duplicate message: 5039831BE3DAE5C0EE183018363B5557:stub
[LID] No cached mapping, attempting reverse lookup for 114194640801953@lid
[LidHandler] Attempting reverse lookup for LID: 114194640801953@lid
[LID] Warning: Could not resolve LID 114194640801953@lid for fromMe message
messages.upsert received for instance 6860DCA0E2819 : {
  "messages": [
    {
      "key": {
        "remoteJid": "114194640801953@lid",
        "fromMe": true,
        "id": "5039831BE3DAE5C0EE183018363B5557"
      },
      "message": {
        "conversation": "Hu",
        "messageContextInfo": {
          "messageSecret": "o8/MIjcR/p43gIP0twH/7Be2dASVtEdCxAlHwf+TfbM="
        }
      },
      "messageTimestamp": "1756651196",
      "status": "READ",
      "userReceipt": [
        {
          "userJid": "60196953307@s.whatsapp.net",
          "receiptTimestamp": "0",
          "readTimestamp": "1756651196",
          "playedTimestamp": "0"
        },
        {
          "userJid": "114194640801953@lid",
          "receiptTimestamp": "1756651196",
          "readTimestamp": "0",
          "playedTimestamp": "0"
        }
      ],
      "messageSecret": "o8/MIjcR/p43gIP0twH/7Be2dASVtEdCxAlHwf+TfbM=",
      "isMentionedInStatus": false
    }
  ],
  "type": "notify",
  "requestId": "3EB0F0BBA33325DAAB0228"
}
[LID] Pattern 2: FromMe=true, LID remoteJid (need reverse lookup)
Normalized @lid 114194640801953@lid to 60196953307@s.whatsapp.net
Skipping duplicate message: 5039831BE3DAE5C0EE183018363B5557:stub
[LID] No cached mapping, attempting reverse lookup for 114194640801953@lid
[LidHandler] Attempting reverse lookup for LID: 114194640801953@lid
[LID] Warning: Could not resolve LID 114194640801953@lid for fromMe message
Closing open session in favor of incoming prekey bundle
Closing session: SessionEntry {
  _chains: {
    'BXdDrP0AvC5BhO+QyeCJPbLjaQvTsVwPEncyMyOZ5T4Y': { chainKey: [Object], chainType: 2, messageKeys: [Object] },
    BU1KqrJ23yFVuURDYX62JCTJjYBMhvNqfLD4ImJm3MI5: { chainKey: [Object], chainType: 2, messageKeys: [Object] },
    'BV5V4HXsVWsXnUfrtOBfD0jelHl/vunWD43f4v1SYqMg': { chainKey: [Object], chainType: 2, messageKeys: [Object] },
    'BbQxe58qnIyO/qE0r1Yok5FyJ9FUECOjYqfCy3Lb0xka': { chainKey: [Object], chainType: 2, messageKeys: [Object] },
    'BYqpx7U86keTwG5DUKSkI+MEmHwiiE4oN+exzbx+KrI4': { chainKey: [Object], chainType: 1, messageKeys: {} }
  },
  registrationId: 696358902,
  currentRatchet: {
    ephemeralKeyPair: {
      pubKey: <Buffer 05 8a a9 c7 b5 3c ea 47 93 c0 6e 43 50 a4 a4 23 e3 04 98 7c 22 88 4e 28 37 e7 b1 cd bc 7e 2a b2 38>,
      privKey: <Buffer 68 f6 84 01 42 cc 02 3b 4f 0c 95 c5 36 e8 fb a8 40 76 89 61 a5 48 44 66 8f 3d 78 6d db 90 df 51>
    },
    lastRemoteEphemeralKey: <Buffer 05 b4 31 7b 9f 2a 9c 8c 8e fe a1 34 af 56 28 93 91 72 27 d1 54 10 23 a3 62 a7 c2 cb 72 db d3 19 1a>,
    previousCounter: 1,
    rootKey: <Buffer 50 94 9d 42 d6 82 2a 62 05 d3 41 ed 99 3d 01 85 5e 7f 4b b6 79 e0 34 cf dc 88 ae 9b a5 0f f1 ea>
  },
  indexInfo: {
    baseKey: <Buffer 05 f5 cc 72 7f 0b 14 a5 76 f2 a9 be df c2 31 32 f8 8d 64 80 e0 9e 9f 57 aa 19 b7 91 32 b5 4e 33 4a>,
    baseKeyType: 2,
    closed: -1,
    used: 1756651203141,
    created: 1756650027390,
    remoteIdentityKey: <Buffer 05 d5 12 2b 08 e3 20 d3 00 d0 d1 26 e7 72 5b 65 01 d1 2c be 81 df 07 36 64 d0 ca 55 94 68 7a fd 46>
  }
}
messages.upsert received for instance 6860DCA0E2819 : {
  "messages": [
    {
      "key": {
        "remoteJid": "60173577321@s.whatsapp.net",
        "fromMe": true,
        "id": "3CB48C92A14B598B1E6DF1C0FEE6F3F2"
      },
      "messageTimestamp": 1756651209,
      "broadcast": false,
      "status": 2,
      "verifiedBizName": "Wabot Demo",
      "message": {
        "protocolMessage": {
          "type": "PEER_DATA_OPERATION_REQUEST_RESPONSE_MESSAGE",
          "peerDataOperationRequestResponseMessage": {
            "peerDataOperationRequestType": "PLACEHOLDER_MESSAGE_RESEND",
            "stanzaId": "3EB043650F867BC044A6C2",
            "peerDataOperationResult": [
              {
                "mediaUploadResult": "SUCCESS",
                "placeholderMessageResendResponse": {
                  "webMessageInfoBytes": "CjkKEzExNDE5NDY0MDgwMTk1M0BsaWQQARogNTAzOTgzMUJFM0RBRTVDMEVFMTgzMDE4MzYzQjU1NTcSKQoCSHWaAiIaIKPPzCI3Ef6eN4CD9LcB/+wXtnQElbRHQsQJR8H/k32zGLy90cUGIATCAiYKGjYwMTk2OTUzMzA3QHMud2hhdHNhcHAubmV0EAAYvL3RxQYgAMICHwoTMTE0MTk0NjQwODAxOTUzQGxpZBC8vdHFBhgAIACKAyCjz8wiNxH+njeAg/S3Af/sF7Z0BJW0R0LECUfB/5N9s4gEAA=="
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
{"level":50,"time":"2025-08-31T14:40:09.914Z","pid":567355,"hostname":"wabotv3-sql","key":{"remoteJid":"114194640801953@lid","fromMe":true,"id":"5039831BE3DAE5C0EE183018363B5557"},"err":{"type":"PreKeyError","message":"Invalid PreKey ID","stack":"PreKeyError: Invalid PreKey ID\n    at SessionBuilder.initIncoming (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_builder.js:66:19)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at async 80758756622573.0 [as awaitable] (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:205:30)\n    at async _asyncQueueExecutor (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/queue_job.js:20:29)","name":"PreKeyError"},"messageType":"pkmsg","sender":"80758756622573@lid","author":"80758756622573@lid","isSessionRecordError":false,"msg":"failed to decrypt message"}
messages.upsert received for instance 6860DCA0E2819 : {
  "messages": [
    {
      "key": {
        "remoteJid": "114194640801953@lid",
        "fromMe": true,
        "id": "5039831BE3DAE5C0EE183018363B5557"
      },
      "messageTimestamp": 1756651209,
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
Skipping duplicate message: 5039831BE3DAE5C0EE183018363B5557:stub
[LID] No cached mapping, attempting reverse lookup for 114194640801953@lid
[LidHandler] Attempting reverse lookup for LID: 114194640801953@lid
[LID] Warning: Could not resolve LID 114194640801953@lid for fromMe message
messages.upsert received for instance 6860DCA0E2819 : {
  "messages": [
    {
      "key": {
        "remoteJid": "114194640801953@lid",
        "fromMe": true,
        "id": "5039831BE3DAE5C0EE183018363B5557"
      },
      "message": {
        "conversation": "Hu",
        "messageContextInfo": {
          "messageSecret": "o8/MIjcR/p43gIP0twH/7Be2dASVtEdCxAlHwf+TfbM="
        }
      },
      "messageTimestamp": "1756651196",
      "status": "READ",
      "userReceipt": [
        {
          "userJid": "60196953307@s.whatsapp.net",
          "receiptTimestamp": "0",
          "readTimestamp": "1756651196",
          "playedTimestamp": "0"
        },
        {
          "userJid": "114194640801953@lid",
          "receiptTimestamp": "1756651196",
          "readTimestamp": "0",
          "playedTimestamp": "0"
        }
      ],
      "messageSecret": "o8/MIjcR/p43gIP0twH/7Be2dASVtEdCxAlHwf+TfbM=",
      "isMentionedInStatus": false
    }
  ],
  "type": "notify",
  "requestId": "3EB043650F867BC044A6C2"
}
[LID] Pattern 2: FromMe=true, LID remoteJid (need reverse lookup)
Normalized @lid 114194640801953@lid to 60196953307@s.whatsapp.net
Skipping duplicate message: 5039831BE3DAE5C0EE183018363B5557:stub
[LID] No cached mapping, attempting reverse lookup for 114194640801953@lid
[LidHandler] Attempting reverse lookup for LID: 114194640801953@lid
[LID] Warning: Could not resolve LID 114194640801953@lid for fromMe message
Closing open session in favor of incoming prekey bundle
Closing session: SessionEntry {
  _chains: {
    'Bevsp/TQjOv/hffAT+bGr+Vu5DZNZvSqmFJrZ3+t1iVX': { chainKey: [Object], chainType: 2, messageKeys: {} },
    'BRir6WTg0InxkY3wNeGiZobEbx41gWWgB+yIL7bi5WQe': { chainKey: [Object], chainType: 1, messageKeys: {} }
  },
  registrationId: 696358902,
  currentRatchet: {
    ephemeralKeyPair: {
      pubKey: <Buffer 05 18 ab e9 64 e0 d0 89 f1 91 8d f0 35 e1 a2 66 86 c4 6f 1e 35 81 65 a0 07 ec 88 2f b6 e2 e5 64 1e>,
      privKey: <Buffer 08 da 6f 90 3f f9 83 4f 4a 9f ba fd 8b 17 d9 5f a8 bd 5f b6 fc c6 98 a1 a9 f8 ed 5f 5c c3 83 4d>
    },
    lastRemoteEphemeralKey: <Buffer 05 eb ec a7 f4 d0 8c eb ff 85 f7 c0 4f e6 c6 af e5 6e e4 36 4d 66 f4 aa 98 52 6b 67 7f ad d6 25 57>,
    previousCounter: 0,
    rootKey: <Buffer 09 56 2c 82 60 d2 7c da 1e b3 4e 07 9e ec 5f f1 89 4c 28 71 4e bd 43 ab 93 67 4e e9 02 f4 e9 12>
  },
  indexInfo: {
    baseKey: <Buffer 05 74 42 07 e4 37 e4 ae d0 c3 63 06 e4 05 cd 50 61 2a 78 3f 4a 0c bf 99 02 cd c8 b0 2e 3b e5 66 2c>,
    baseKeyType: 2,
    closed: -1,
    used: 1756650168822,
    created: 1756650168822,
    remoteIdentityKey: <Buffer 05 d5 12 2b 08 e3 20 d3 00 d0 d1 26 e7 72 5b 65 01 d1 2c be 81 df 07 36 64 d0 ca 55 94 68 7a fd 46>
  }
}
messages.upsert received for instance 6860DCA0E2819 : {
  "messages": [
    {
      "key": {
        "remoteJid": "114194640801953@lid",
        "fromMe": true,
        "id": "5039831BE3DAE5C0EE183018363B5557"
      },
      "messageTimestamp": 1756651210,
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
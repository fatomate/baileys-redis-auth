[2025-08-31 22:47:39] Memory (app): RSS=238.09 MB, Heap=123.91 MB/160.13 MB
{"level":50,"time":"2025-08-31T14:47:50.285Z","pid":568264,"hostname":"wabotv3-sql","key":{"remoteJid":"114194640801953@lid","fromMe":true,"id":"8E1DC682DE98A04401E333F5972ACD73"},"err":{"type":"SessionError","message":"No session record","stack":"SessionError: No session record\n    at 80758756622573.0 [as awaitable] (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:169:23)\n    at async _asyncQueueExecutor (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/queue_job.js:20:29)","name":"SessionError"},"messageType":"msg","sender":"80758756622573@lid","author":"80758756622573@lid","isSessionRecordError":true,"msg":"failed to decrypt message"}
messages.upsert received for instance 6860DCA0E2819 : {
  "messages": [
    {
      "key": {
        "remoteJid": "114194640801953@lid",
        "fromMe": true,
        "id": "8E1DC682DE98A04401E333F5972ACD73"
      },
      "messageTimestamp": 1756651669,
      "pushName": "Wabot Demo",
      "broadcast": false,
      "status": 2,
      "messageStubType": 2,
      "messageStubParameters": [
        "No session record"
      ]
    }
  ],
  "type": "notify"
}
[LID] Pattern 2: FromMe=true, LID remoteJid (need reverse lookup)
Normalized @lid 114194640801953@lid to 60196953307@s.whatsapp.net
[LID] No cached mapping, attempting reverse lookup for 114194640801953@lid
[LidHandler] Attempting reverse lookup for LID: 114194640801953@lid
Would save message to MongoDB: 8E1DC682DE98A04401E333F5972ACD73
Emitted new_message_1 for message: 8E1DC682DE98A04401E333F5972ACD73 (type: text, media: pending)
[LID] Warning: Could not resolve LID 114194640801953@lid for fromMe message
[6860DCA0E2819] Health check passed
messages.upsert received for instance 6860DCA0E2819 : {
  "messages": [
    {
      "key": {
        "remoteJid": "60173577321@s.whatsapp.net",
        "fromMe": true,
        "id": "433B4F8CBFF7DAD2C350C6FF8F7AA0FF"
      },
      "messageTimestamp": 1756651675,
      "broadcast": false,
      "status": 2,
      "message": {
        "protocolMessage": {
          "type": "PEER_DATA_OPERATION_REQUEST_RESPONSE_MESSAGE",
          "peerDataOperationRequestResponseMessage": {
            "peerDataOperationRequestType": "PLACEHOLDER_MESSAGE_RESEND",
            "stanzaId": "3EB051BC84984572614A3F",
            "peerDataOperationResult": [
              {
                "mediaUploadResult": "SUCCESS",
                "placeholderMessageResendResponse": {
                  "webMessageInfoBytes": "CjkKEzExNDE5NDY0MDgwMTk1M0BsaWQQARogOEUxREM2ODJERTk4QTA0NDAxRTMzM0Y1OTcyQUNENzMSLAoFSGFhYWGaAiIaICCYx3CgZnU8GRtUn7AeyLduMTrXxTTYndubCn1Oi4BwGJXB0cUGIATCAiYKGjYwMTk2OTUzMzA3QHMud2hhdHNhcHAubmV0EAAYlsHRxQYgAMICHwoTMTE0MTk0NjQwODAxOTUzQGxpZBCVwdHFBhgAIACKAyAgmMdwoGZ1PBkbVJ+wHsi3bjE618U02J3bmwp9TouAcIgEAA=="
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
messages.upsert received for instance 6860DCA0E2819 : {
  "messages": [
    {
      "key": {
        "remoteJid": "114194640801953@lid",
        "fromMe": true,
        "id": "8E1DC682DE98A04401E333F5972ACD73"
      },
      "message": {
        "conversation": "Haaaa",
        "messageContextInfo": {
          "messageSecret": "IJjHcKBmdTwZG1SfsB7It24xOtfFNNid25sKfU6LgHA="
        }
      },
      "messageTimestamp": "1756651669",
      "status": "READ",
      "userReceipt": [
        {
          "userJid": "60196953307@s.whatsapp.net",
          "receiptTimestamp": "0",
          "readTimestamp": "1756651670",
          "playedTimestamp": "0"
        },
        {
          "userJid": "114194640801953@lid",
          "receiptTimestamp": "1756651669",
          "readTimestamp": "0",
          "playedTimestamp": "0"
        }
      ],
      "messageSecret": "IJjHcKBmdTwZG1SfsB7It24xOtfFNNid25sKfU6LgHA=",
      "isMentionedInStatus": false
    }
  ],
  "type": "notify",
  "requestId": "3EB051BC84984572614A3F"
}
[LID] Pattern 2: FromMe=true, LID remoteJid (need reverse lookup)
Normalized @lid 114194640801953@lid to 60196953307@s.whatsapp.net
Skipping duplicate message: 8E1DC682DE98A04401E333F5972ACD73:stub
[LID] No cached mapping, attempting reverse lookup for 114194640801953@lid
[LidHandler] Attempting reverse lookup for LID: 114194640801953@lid
[LID] Warning: Could not resolve LID 114194640801953@lid for fromMe message
{"level":50,"time":"2025-08-31T14:47:56.491Z","pid":568264,"hostname":"wabotv3-sql","key":{"remoteJid":"114194640801953@lid","fromMe":true,"id":"8E1DC682DE98A04401E333F5972ACD73"},"err":{"type":"SessionError","message":"No session record","stack":"SessionError: No session record\n    at 80758756622573.0 [as awaitable] (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:169:23)\n    at async _asyncQueueExecutor (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/queue_job.js:20:29)","name":"SessionError"},"messageType":"msg","sender":"80758756622573@lid","author":"80758756622573@lid","isSessionRecordError":true,"msg":"failed to decrypt message"}
messages.upsert received for instance 6860DCA0E2819 : {
  "messages": [
    {
      "key": {
        "remoteJid": "114194640801953@lid",
        "fromMe": true,
        "id": "8E1DC682DE98A04401E333F5972ACD73"
      },
      "messageTimestamp": 1756651675,
      "pushName": "Wabot Demo",
      "broadcast": false,
      "status": 2,
      "messageStubType": 2,
      "messageStubParameters": [
        "No session record"
      ]
    }
  ],
  "type": "notify"
}
[LID] Pattern 2: FromMe=true, LID remoteJid (need reverse lookup)
Normalized @lid 114194640801953@lid to 60196953307@s.whatsapp.net
Skipping duplicate message: 8E1DC682DE98A04401E333F5972ACD73:stub
[LID] No cached mapping, attempting reverse lookup for 114194640801953@lid
[LidHandler] Attempting reverse lookup for LID: 114194640801953@lid
[LID] Warning: Could not resolve LID 114194640801953@lid for fromMe message
Closing open session in favor of incoming prekey bundle
Closing session: SessionEntry {
  _chains: {
    BSXGJ9UHpAcrmmqCKLTZAcquDtbePL09H1csMtyf0lwz: { chainKey: [Object], chainType: 2, messageKeys: {} },
    'BZjBDSvxZHrHEs+NTdA4YSaUDGQLwnkuzrPTvpQg7MkM': { chainKey: [Object], chainType: 2, messageKeys: [Object] },
    BeaThyjfEahqzpXXJt2yAb9dGQjUs2gSMdSeW6dQcVEW: { chainKey: [Object], chainType: 1, messageKeys: {} }
  },
  registrationId: 696358902,
  currentRatchet: {
    ephemeralKeyPair: {
      pubKey: <Buffer 05 e6 93 87 28 df 11 a8 6a ce 95 d7 26 dd b2 01 bf 5d 19 08 d4 b3 68 12 31 d4 9e 5b a7 50 71 51 16>,
      privKey: <Buffer 98 bd 56 dd fe 14 ec 00 de b9 03 c3 94 fe 67 55 6a e4 09 86 00 c1 62 3c 61 7f ed 8e 7e f2 4f 75>
    },
    lastRemoteEphemeralKey: <Buffer 05 98 c1 0d 2b f1 64 7a c7 12 cf 8d 4d d0 38 61 26 94 0c 64 0b c2 79 2e ce b3 d3 be 94 20 ec c9 0c>,
    previousCounter: 1,
    rootKey: <Buffer 68 d5 2c f1 85 56 4d 21 ed d7 40 a2 f6 0f 5c be 00 8a 06 7c c9 35 c7 d2 21 57 93 ff 07 ed c5 f8>
  },
  indexInfo: {
    baseKey: <Buffer 05 e9 77 74 1f 4b 36 bb 85 b4 3d 13 7d 05 b3 7f 44 fa b9 96 8b de 16 3a 8d 13 e4 cc 6f ea c9 20 7b>,
    baseKeyType: 2,
    closed: -1,
    used: 1756651675782,
    created: 1756651610525,
    remoteIdentityKey: <Buffer 05 d5 12 2b 08 e3 20 d3 00 d0 d1 26 e7 72 5b 65 01 d1 2c be 81 df 07 36 64 d0 ca 55 94 68 7a fd 46>
  }
}
messages.upsert received for instance 6860DCA0E2819 : {
  "messages": [
    {
      "key": {
        "remoteJid": "60173577321@s.whatsapp.net",
        "fromMe": true,
        "id": "BCBA96AA95B09A4D88F2BA6265B7B387"
      },
      "messageTimestamp": 1756651681,
      "broadcast": false,
      "status": 2,
      "verifiedBizName": "Wabot Demo",
      "message": {
        "protocolMessage": {
          "type": "PEER_DATA_OPERATION_REQUEST_RESPONSE_MESSAGE",
          "peerDataOperationRequestResponseMessage": {
            "peerDataOperationRequestType": "PLACEHOLDER_MESSAGE_RESEND",
            "stanzaId": "3EB06D446A07E58A8AEA4D",
            "peerDataOperationResult": [
              {
                "mediaUploadResult": "SUCCESS",
                "placeholderMessageResendResponse": {
                  "webMessageInfoBytes": "CjkKEzExNDE5NDY0MDgwMTk1M0BsaWQQARogOEUxREM2ODJERTk4QTA0NDAxRTMzM0Y1OTcyQUNENzMSLAoFSGFhYWGaAiIaICCYx3CgZnU8GRtUn7AeyLduMTrXxTTYndubCn1Oi4BwGJXB0cUGIATCAiYKGjYwMTk2OTUzMzA3QHMud2hhdHNhcHAubmV0EAAYlsHRxQYgAMICHwoTMTE0MTk0NjQwODAxOTUzQGxpZBCVwdHFBhgAIACKAyAgmMdwoGZ1PBkbVJ+wHsi3bjE618U02J3bmwp9TouAcIgEAA=="
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
{"level":50,"time":"2025-08-31T14:48:01.998Z","pid":568264,"hostname":"wabotv3-sql","key":{"remoteJid":"114194640801953@lid","fromMe":true,"id":"8E1DC682DE98A04401E333F5972ACD73"},"err":{"type":"PreKeyError","message":"Invalid PreKey ID","stack":"PreKeyError: Invalid PreKey ID\n    at SessionBuilder.initIncoming (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_builder.js:66:19)\n    at async 80758756622573.0 [as awaitable] (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/session_cipher.js:205:30)\n    at async _asyncQueueExecutor (/home/wabotdev/api-wabot-dev/public_html/node_modules/libsignal/src/queue_job.js:20:29)","name":"PreKeyError"},"messageType":"pkmsg","sender":"80758756622573@lid","author":"80758756622573@lid","isSessionRecordError":false,"msg":"failed to decrypt message"}
messages.upsert received for instance 6860DCA0E2819 : {
  "messages": [
    {
      "key": {
        "remoteJid": "114194640801953@lid",
        "fromMe": true,
        "id": "8E1DC682DE98A04401E333F5972ACD73"
      },
      "messageTimestamp": 1756651681,
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
[LID] No cached mapping, attempting reverse lookup for 114194640801953@lid
[LidHandler] Attempting reverse lookup for LID: 114194640801953@lid
Skipping duplicate message: 8E1DC682DE98A04401E333F5972ACD73:stub
[LID] Warning: Could not resolve LID 114194640801953@lid for fromMe message
messages.upsert received for instance 6860DCA0E2819 : {
  "messages": [
    {
      "key": {
        "remoteJid": "114194640801953@lid",
        "fromMe": true,
        "id": "8E1DC682DE98A04401E333F5972ACD73"
      },
      "message": {
        "conversation": "Haaaa",
        "messageContextInfo": {
          "messageSecret": "IJjHcKBmdTwZG1SfsB7It24xOtfFNNid25sKfU6LgHA="
        }
      },
      "messageTimestamp": "1756651669",
      "status": "READ",
      "userReceipt": [
        {
          "userJid": "60196953307@s.whatsapp.net",
          "receiptTimestamp": "0",
          "readTimestamp": "1756651670",
          "playedTimestamp": "0"
        },
        {
          "userJid": "114194640801953@lid",
          "receiptTimestamp": "1756651669",
          "readTimestamp": "0",
          "playedTimestamp": "0"
        }
      ],
      "messageSecret": "IJjHcKBmdTwZG1SfsB7It24xOtfFNNid25sKfU6LgHA=",
      "isMentionedInStatus": false
    }
  ],
  "type": "notify",
  "requestId": "3EB06D446A07E58A8AEA4D"
}
[LID] Pattern 2: FromMe=true, LID remoteJid (need reverse lookup)
Normalized @lid 114194640801953@lid to 60196953307@s.whatsapp.net
Skipping duplicate message: 8E1DC682DE98A04401E333F5972ACD73:stub
[LID] No cached mapping, attempting reverse lookup for 114194640801953@lid
[LidHandler] Attempting reverse lookup for LID: 114194640801953@lid
[LID] Warning: Could not resolve LID 114194640801953@lid for fromMe message
messages.upsert received for instance 6860DCA0E2819 : {
  "messages": [
    {
      "key": {
        "remoteJid": "114194640801953@lid",
        "fromMe": true,
        "id": "8E1DC682DE98A04401E333F5972ACD73"
      },
      "messageTimestamp": 1756651682,
      "pushName": "Wabot Demo",
      "broadcast": false,
      "status": 2,
      "verifiedBizName": "Wabot Demo",
      "message": {
        "conversation": "Haaaa"
      }
    }
  ],
  "type": "notify"
}
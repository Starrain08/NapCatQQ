import BaseAction from '../BaseAction';
import { OB11Message, OB11User } from '../../types';
import { getGroup, groups } from '@/core/data';
import { ActionName } from '../types';
import { ChatType } from '@/core/entities';
import { NTQQMsgApi } from '@/core/apis/msg';
import { OB11Constructor } from '../../constructor';
import { FromSchema, JSONSchema } from 'json-schema-to-ts';
import { MessageUnique } from '@/common/utils/MessageUnique';
interface Response {
  messages: OB11Message[];
}

const SchemaData = {
  type: 'object',
  properties: {
    group_id: { type: ['number', 'string'] },
    message_seq: { type: 'number' },
    count: { type: 'number' }
  },
  required: ['group_id', 'message_seq', 'count']
} as const satisfies JSONSchema;

type Payload = FromSchema<typeof SchemaData>;

export default class GoCQHTTPGetGroupMsgHistory extends BaseAction<Payload, Response> {
  actionName = ActionName.GoCQHTTP_GetGroupMsgHistory;
  PayloadSchema = SchemaData;
  protected async _handle(payload: Payload): Promise<Response> {
    const group = await getGroup(payload.group_id.toString());
    if (!group) {
      throw `群${payload.group_id}不存在`;
    }
    const startMsgId = (await MessageUnique.getMsgIdAndPeerByShortId(payload.message_seq))?.MsgId || '0';
    // log("startMsgId", startMsgId)
    const historyResult = (await NTQQMsgApi.getMsgHistory({
      chatType: ChatType.group,
      peerUid: group.groupCode
    }, startMsgId, parseInt(payload.count?.toString()) || 20));
    //logDebug(historyResult);
    const msgList = historyResult.msgList;
    await Promise.all(msgList.map(async msg => {
      msg.id = await MessageUnique.createMsg({ guildId: '', chatType: msg.chatType, peerUid: msg.peerUid }, msg.msgId);
    }));
    const ob11MsgList = await Promise.all(msgList.map(msg => OB11Constructor.message(msg)));
    return { 'messages': ob11MsgList };
  }
}

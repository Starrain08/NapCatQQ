import { ModifyProfileParams, SelfInfo, User, UserDetailInfoByUin } from '@/core/entities';
import { friends, selfInfo } from '@/core/data';
import { CacheClassFuncAsync, CacheClassFuncAsyncExtend } from '@/common/utils/helper';
import { napCatCore } from '@/core';
import { NodeIKernelProfileListener, ProfileListener } from '@/core/listeners';
import { RequestUtil } from '@/common/utils/request';
import { logWarn } from '@/common/utils/log';
import { NTEventDispatch } from '@/common/utils/EventTask';
import { NodeIKernelProfileService } from '@/core/services';

export class NTQQUserApi {
  static async getProfileLike(uid: string) {
    return napCatCore.session.getProfileLikeService().getBuddyProfileLike({
      friendUids: [
        uid
      ],
      basic: 1,
      vote: 1,
      favorite: 0,
      userProfile: 1,
      type: 2,
      start: 0,
      limit: 20
    });
  }
  static async setLongNick(longNick: string) {
    return napCatCore.session.getProfileService().setLongNick(longNick);
  }
  static async setSelfOnlineStatus(status: number, extStatus: number, batteryStatus: number) {
    return napCatCore.session.getMsgService().setStatus({ status: status, extStatus: extStatus, batteryStatus: batteryStatus });
  }
  static async getBuddyRecommendContactArkJson(uin: string, sencenID = '') {
    return napCatCore.session.getBuddyService().getBuddyRecommendContactArkJson(uin, sencenID);
  }
  static async like(uid: string, count = 1): Promise<{ result: number, errMsg: string, succCounts: number }> {
    return napCatCore.session.getProfileLikeService().setBuddyProfileLike({
      friendUid: uid,
      sourceId: 71,
      doLikeCount: count,
      doLikeTollCount: 0
    });
  }

  static async setQQAvatar(filePath: string) {
    type setQQAvatarRet = { result: number, errMsg: string };
    const ret = await napCatCore.session.getProfileService().setHeader(filePath) as setQQAvatarRet;
    return { result: ret?.result, errMsg: ret?.errMsg };
  }
  static async setGroupAvatar(gc: string, filePath: string) {
    return napCatCore.session.getGroupService().setHeader(gc, filePath);
  }

  static async getSelfInfo() {

  }

  static async getUserInfo(uid: string) {

  }
  //   enum ProfileBizType {
  //     KALL,
  //     KBASEEXTEND,
  //     KVAS,
  //     KQZONE,
  //     KOTHER
  // }
  static async getUserDetailInfo(uid: string) {
    type EventService = NodeIKernelProfileService['getUserDetailInfoWithBizInfo'];
    type EventListener = NodeIKernelProfileListener['onProfileDetailInfoChanged'];
    let [_retData, profile] = await NTEventDispatch.CallNormalEvent
      <EventService, EventListener>
      (
        'NodeIKernelProfileService/getUserDetailInfoWithBizInfo',
        'NodeIKernelProfileListener/onProfileDetailInfoChanged',
        2,
        5000,
        (profile: User) => {
          if (profile.uid === uid) {
            return true;
          }
          return false;
        },
        uid,
        [0]
      );
    return profile;
  }
  static async modifySelfProfile(param: ModifyProfileParams) {
    return napCatCore.session.getProfileService().modifyDesktopMiniProfile(param);
  }
  //需要异常处理
  @CacheClassFuncAsync(1800 * 1000)
  static async getCookies(domain: string) {
    const ClientKeyData = await NTQQUserApi.forceFetchClientKey();
    const requestUrl = 'https://ssl.ptlogin2.qq.com/jump?ptlang=1033&clientuin=' + selfInfo.uin + '&clientkey=' + ClientKeyData.clientKey + '&u1=https%3A%2F%2F' + domain + '%2F' + selfInfo.uin + '%2Finfocenter&keyindex=19%27'
    let cookies: { [key: string]: string; } = await RequestUtil.HttpsGetCookies(requestUrl);
    return cookies;
  }
  @CacheClassFuncAsync(1800 * 1000)
  static async getPSkey(domainList: string[]) {
    return await napCatCore.session.getTipOffService().getPskey(domainList, true);
  }
  static async getRobotUinRange(): Promise<Array<any>> {
    const robotUinRanges = await napCatCore.session.getRobotService().getRobotUinRange({
      justFetchMsgConfig: '1',
      type: 1,
      version: 0,
      aioKeywordVersion: 0
    });
    // console.log(robotUinRanges?.response?.robotUinRanges);
    return robotUinRanges?.response?.robotUinRanges;
  }
  //需要异常处理
  @CacheClassFuncAsync(1800 * 1000)
  static async getQzoneCookies() {
    const ClientKeyData = await NTQQUserApi.forceFetchClientKey();
    const requestUrl = 'https://ssl.ptlogin2.qq.com/jump?ptlang=1033&clientuin=' + selfInfo.uin + '&clientkey=' + ClientKeyData.clientKey + '&u1=https%3A%2F%2Fuser.qzone.qq.com%2F' + selfInfo.uin + '%2Finfocenter&keyindex=19%27'
    let cookies: { [key: string]: string; } = await RequestUtil.HttpsGetCookies(requestUrl);
    return cookies;
  }
  //需要异常处理
  @CacheClassFuncAsync(1800 * 1000)
  static async getSkey(): Promise<string | undefined> {
    const ClientKeyData = await NTQQUserApi.forceFetchClientKey();
    if (ClientKeyData.result !== 0) {
      throw new Error('getClientKey Error');
    }
    const clientKey = ClientKeyData.clientKey;
    const keyIndex = ClientKeyData.keyIndex;
    const requestUrl = 'https://ssl.ptlogin2.qq.com/jump?ptlang=1033&clientuin=' + selfInfo.uin + '&clientkey=' + clientKey + '&u1=https%3A%2F%2Fh5.qzone.qq.com%2Fqqnt%2Fqzoneinpcqq%2Ffriend%3Frefresh%3D0%26clientuin%3D0%26darkMode%3D0&keyindex=19%27';
    let cookies: { [key: string]: string; } = await RequestUtil.HttpsGetCookies(requestUrl);
    const skey = cookies['skey'];
    if (!skey) {
      throw new Error('getSkey Skey is Empty');
    }
    return skey;
  }
  @CacheClassFuncAsyncExtend(3600, 'Uin2Uid', (Uin: string, Uid: string | undefined) => {
    if (Uid && Uid.indexOf('u_') != -1) {
      return true
    }
    logWarn("uin转换到uid时异常", Uin);
    return false;
  })
  static async getUidByUin(Uin: string) {
    let ret = await NTEventDispatch.CallNoListenerEvent
      <(Uin: string[]) => Promise<{ uidInfo: Map<string, string> }>>(
        'NodeIKernelUixConvertService/getUid',
        5000,
        [Uin]
      );
    let uid = ret.uidInfo.get(Uin); //通过QQ默认方式转换
    if (!uid) {
      Array.from(friends.values()).forEach((t) => {
        if (t.uin == Uin) {
          //logDebug('getUidByUin', t.uid, t.uin, Uin);
          uid = t.uid;
        }
        //console.log(t.uid, t.uin, Uin);
      });
      //uid = Array.from(friends.values()).find((t) => { t.uin == Uin })?.uid;  // 从NC维护的QQ Buddy缓存 转换
    }

    // if (!uid) {
    //   uid = (await NTQQFriendApi.getFriends(false)).find((t) => { t.uin == Uin })?.uid;  //从QQ Native 缓存转换 方法一
    // }
    // if (!uid) {
    //   uid = (await NTQQFriendApi.getFriends(true)).find((t) => { t.uin == Uin })?.uid;  //从QQ Native 非缓存转换 方法二
    // }
    if (!uid) {
      let unveifyUid = (await NTQQUserApi.getUserDetailInfoByUin(Uin)).info.uid;//从QQ Native 特殊转换 方法三
      if (unveifyUid.indexOf("*") == -1) {
        uid = unveifyUid;
      }
    }
    return uid;
  }
  @CacheClassFuncAsyncExtend(3600, 'Uid2Uin', (Uid: string | undefined, Uin: number | undefined) => {
    if (Uin && Uin != 0 && !isNaN(Uin)) {
      return true
    }
    logWarn("uid转换到uin时异常", Uid);
    return false;
  })
  static async getUinByUid(Uid: string | undefined) {
    if (!Uid) {
      return '';
    }
    let ret = await NTEventDispatch.CallNoListenerEvent
      <(Uin: string[]) => Promise<{ uinInfo: Map<string, string> }>>(
        'NodeIKernelUixConvertService/getUin',
        5000,
        [Uid]
      );
    let uin = ret.uinInfo.get(Uid);
    if (!uin) {
      //从Buddy缓存获取Uin
      Array.from(friends.values()).forEach((t) => {
        if (t.uid == Uid) {
          uin = t.uin;
        }
      })
    }
    if (!uin) {
      uin = (await NTQQUserApi.getUserDetailInfo(Uid)).uin; //从QQ Native 转换
    }

    // if (!uin) {
    //   uin = (await NTQQFriendApi.getFriends(false)).find((t) => { t.uid == Uid })?.uin;  //从QQ Native 缓存转换
    // }
    // if (!uin) {
    //   uin = (await NTQQFriendApi.getFriends(true)).find((t) => { t.uid == Uid })?.uin;  //从QQ Native 非缓存转换
    // }
    return uin;
  }
  static async getRecentContactListSnapShot(count: number) {
    return await napCatCore.session.getRecentContactService().getRecentContactListSnapShot(count);
  }
  static async getRecentContactListSyncLimit(count: number) {
    return await napCatCore.session.getRecentContactService().getRecentContactListSyncLimit(count);
  }
  static async getRecentContactListSync() {
    return await napCatCore.session.getRecentContactService().getRecentContactListSync();
  }
  static async getRecentContactList() {
    return await napCatCore.session.getRecentContactService().getRecentContactList();
  }
  static async getUserDetailInfoByUin(Uin: string) {
    return NTEventDispatch.CallNoListenerEvent
      <(Uin: string) => Promise<UserDetailInfoByUin>>(
        'NodeIKernelProfileService/getUserDetailInfoByUin',
        5000,
        Uin
      );
  }
  @CacheClassFuncAsync(3600 * 1000, 'ClientKey')
  static async forceFetchClientKey() {
    return await napCatCore.session.getTicketService().forceFetchClientKey('');
  }
}

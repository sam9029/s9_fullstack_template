//
//  DTFUICustomConfig.h
//  DTFUtility
//
//  Created by 汪澌哲 on 2024/1/7.
//  Copyright © 2024 com.alipay.iphoneclient.zoloz. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface DTFGuideConfig : NSObject

@property (copy, nonatomic) NSString *titleColor;
@property (copy, nonatomic) NSString *titleBackPath;
@property (copy, nonatomic) NSString *titleBackBase64;
@property (copy, nonatomic) NSString *titleClosePath;
@property (copy, nonatomic) NSString *titleCloseBase64;
@property (copy, nonatomic) NSString *bannerImg;
@property (copy, nonatomic) NSString *agrtTopTipsColor;
@property (copy, nonatomic) NSString *agrtUnSelColor;
@property (copy, nonatomic) NSString *agrtSelBgColor;
@property (copy, nonatomic) NSString *agrtAgreeColor;
@property (copy, nonatomic) NSString *agrtColor;
@property (copy, nonatomic) NSString *startBtnColor;
@property (copy, nonatomic) NSString *agrtBotTipsColor;
@property (copy, nonatomic) NSString *startBtnDisColor;
@property (copy, nonatomic) NSString *startBtnBgColor;
@property (copy, nonatomic) NSString *startBtnDisBgColor;
@property (copy, nonatomic) NSString *elderBtnDisColor;
@property (copy, nonatomic) NSString *elderBtnBgColor;
@property (copy, nonatomic) NSString *elderBtnDisBgColor;
@property (copy, nonatomic) NSString *exitBtnColor;
@property (copy, nonatomic) NSString *exitBtnBgColor;
@property (copy, nonatomic) NSString *rareFormNameColor;
@property (copy, nonatomic) NSString *rareFormIDColor;
@property (copy, nonatomic) NSString *elderBtnColor;
@property (copy, nonatomic) NSString *rareFormEntBtnColor;
@property (copy, nonatomic) NSString *permissionDialogConfirmColor;
@property (copy, nonatomic) NSString *permissionToastTitleColor;
@property (copy, nonatomic) NSString *permissionToastMsgColor;
@property (copy, nonatomic) NSString *permissionToastBgColor;
@property (copy, nonatomic) NSString *dialogExitTitleColor;
@property (copy, nonatomic) NSString *dialogExitMsgColor;
@property (copy, nonatomic) NSString *dialogExitCancelColor;
@property (copy, nonatomic) NSString *dialogExitConfirmColor;
@property (copy, nonatomic) NSString *dialogPermissionFailedTitleColor;
@property (copy, nonatomic) NSString *dialogPermissionFailedMsgColor;
@property (copy, nonatomic) NSString *dialogPermissionFailedConfirmColor;
@property (copy, nonatomic) NSString *dialogPermissionFailedCancelColor;
@property (copy, nonatomic) NSString *dialogSupportFailedTitleColor;
@property (copy, nonatomic) NSString *dialogSupportFailedMsgColor;
@property (copy, nonatomic) NSString *dialogSupportFailedConfirmColor;
@property (copy, nonatomic) NSString *dialogNetworkFailedTitleColor;
@property (copy, nonatomic) NSString *dialogNetworkFailedMsgColor;
@property (copy, nonatomic) NSString *dialogNetworkFailedConfirmColor;
@property (copy, nonatomic) NSString *settingFailReason;
@property (copy, nonatomic) NSDictionary *originMap;

@end

@interface DTFFaceConfig : NSObject

@property (copy, nonatomic) NSString *faceBgColor;
@property (copy, nonatomic) NSString *faceTitleColor;
@property (copy, nonatomic) NSString *circleTxtBgAlpha;
@property (copy, nonatomic) NSString *dialogBgAlpha;
@property (copy, nonatomic) NSString *faceProgressStartColor;
@property (copy, nonatomic) NSString *faceProgressEndColor;
@property (copy, nonatomic) NSString *circleTxtColor;
@property (copy, nonatomic) NSString *exitIconPath;
@property (copy, nonatomic) NSString *exitIconBase64;
@property (copy, nonatomic) NSString *submitTextColor;
@property (copy, nonatomic) NSString *submitLoadingIconBase64;
@property (copy, nonatomic) NSString *submitLoadingIconPath;
@property (copy, nonatomic) NSString *dialogExitTitleColor;
@property (copy, nonatomic) NSString *dialogExitMsgColor;
@property (copy, nonatomic) NSString *dialogExitCancelColor;
@property (copy, nonatomic) NSString *dialogExitConfirmColor;
@property (copy, nonatomic) NSString *dialogTimeOutTitleColor;
@property (copy, nonatomic) NSString *dialogTimeOutMsgColor;
@property (copy, nonatomic) NSString *dialogTimeOutConfirmColor;
@property (copy, nonatomic) NSString *dialogNetworkFailedTitleColor;
@property (copy, nonatomic) NSString *dialogNetworkFailedMsgColor;
@property (copy, nonatomic) NSString *dialogNetworkFailedConfirmColor;
@property (copy, nonatomic) NSString *dialogArchSysFailedTitleColor;
@property (copy, nonatomic) NSString *dialogArchSysFailedMsgColor;
@property (copy, nonatomic) NSString *dialogArchSysFailedConfirmColor;
@property (copy, nonatomic) NSString *dialogTooManyRetriesTitleColor;
@property (copy, nonatomic) NSString *dialogTooManyRetriesMsgColor;
@property (copy, nonatomic) NSString *dialogTooManyRetriesConfirmColor;
@property (copy, nonatomic) NSString *dialogInterruptTitleColor;
@property (copy, nonatomic) NSString *dialogInterruptMsgColor;
@property (copy, nonatomic) NSString *dialogInterruptConfirmColor;
@property (copy, nonatomic) NSString *dialogInterruptCancelColor;
@property (copy, nonatomic) NSString *dialogSDKErrTitleColor;
@property (copy, nonatomic) NSString *dialogSDKErrMsgColor;
@property (copy, nonatomic) NSString *dialogSDKErrConfirmColor;
@property (copy, nonatomic) NSString *dialogCamOpenFailedTitleColor;
@property (copy, nonatomic) NSString *dialogCamOpenFailedMsgColor;
@property (copy, nonatomic) NSString *dialogCamOpenFailedConfirmColor;
@property (copy, nonatomic) NSString *dialogCamOpenFailedCancelColor;
@property (copy, nonatomic) NSString *noticeIconPath;
@property (copy, nonatomic) NSString *noticeIconBase64;
@property (copy, nonatomic) NSString *noticeTxtColor;
@property (copy, nonatomic) NSString *noticeBgColor;


@property (copy, nonatomic) NSString *settingFailReason;

@property (copy, nonatomic) NSString *dialogConfirmBgColor;//弹框确认按钮背景颜色
@property (copy, nonatomic) NSString *dialogCancelBgColor;//弹框取消按钮背景颜色

@end

@interface DTFUICustomConfig : NSObject
@property (strong, nonatomic) DTFGuideConfig *guideConfig;
@property (strong, nonatomic) DTFFaceConfig *faceConfig;

- (instancetype)initWithString:(NSString *)string type:(NSString *)type error:(NSError **)error;
+ (NSString *)checkValueFailt:(NSString *)value key:(NSString *)key;
+ (void)setDefaultForKey:(NSString *)key object:(NSObject *)object ;
+ (void)checkKeyFaultWithDict:(NSDictionary *)dict propertyName:(NSMutableSet *)propertyName settingFailReason:(NSString *)settingFailReason;
+ (NSString *)setValueForKeyWithClass:(NSObject *)object params:(NSDictionary *)params;
+ (UIImage *)getImageWithBse64:(NSString *)base64Str path:(NSString *)path;
+ (UIImage *)submitLoadingIcon;
+ (UIImage *)noticeIcon;
+ (UIImage *)titleCloseIcon;
+ (UIImage *)titleBackIcon;

@end

NS_ASSUME_NONNULL_END

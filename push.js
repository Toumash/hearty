var push = require("web-push");

let vapidKeys = {
  publicKey:
    "BI3k3FZmGDi5O_b2aZtPtQ6YCqVY_U8fOCuEJZtIdfIi7CU5-1E8oLLfjRo4vGx3C3sy3kjcn4b4eE2BWBDvxuA",
  privateKey: "ptvEEcm7H4_IWPqUq2io3Nen29E3hysJxKBQiryw13s"
};

push.setVapidDetails("mailto:xd", vapidKeys.publicKey, vapidKeys.privateKey);

let sub = {"endpoint":"https://fcm.googleapis.com/fcm/send/eYzTlWAN6-E:APA91bFYLhnIyBoWoPYSEr0ww_ufGPv52ytmNQCAFYun_dRQizmN_QeNTIjoJlKYUAF0guXqH0_yCW09ABnJZnWBPixNNn1TieuuhjsO49M1vuwOFyEGAaV0To7a899NLEC8m1Yw3dUf","expirationTime":null,"keys":{"p256dh":"BNrFaCVj_x0yq8-VdQitBdoBT40YIvlbeUkzztFiZb1Xw6GsKE_V251V3Al1e_arEr7m9by-rCxRk9agUCov5SU","auth":"ZftNLVq3tJUD6oJSj_D15A"}};
push.sendNotification(sub, "test message");
/**
 * 在这里填写每一场 Talk。
 * presenter、affiliation、bio、title、abstract、tags、video.driveUrl 都可以直接改。
 * video.driveUrl 支持 Google Drive 分享链接或 file id。
 * status: "past" 出现在往期分享；"upcoming" 出现在近期活动。
 */
export const talks = [
  {
    id: 'affordance-learning',
    status: 'past',
    sequence: '01',
    date: '2026-09-10',
    video: {
      driveUrl: 'https://drive.google.com/file/d/1BtkepBw13QQHFHd23BqD6u7Z8BaFLk_u/view?usp=share_link'
    },
    zh: {
      slot: '首场分享',
      type: '研究者分享',
      title: 'From perception to action with affordance learning',
      abstract: 'Sailing 专注于面向操作的可供性（affordance for manipulation）与视觉-语言-动作（VLA）系统。本次分享从感知到行动，重点围绕可供性学习、主动感知与从 2D 到 4D 的 affordance flow，并结合 A4A、A2A、BridgeAct 等近期工作，介绍真实机器人操作中的研究问题与实践经验。',
      open: '面向全校开放',
      presenter: 'Sailing',
      affiliation: '中科院自动化所 NLPR · 清华大学准博士',
      bio: 'Sailing 是中国科学院自动化研究所（CASIA）模式识别国家重点实验室（NLPR）三年级硕士生，师从连文昭教授；同时也是罗格斯大学研究实习生、清华大学准博士生（incoming PhD）、腾讯 Robotics 具身基础模型实习生。研究方向包括机器人操作、灵巧操作与视觉-语言-动作（VLA），重点关注面向真实机器人系统的多模态感知与具身智能。',
      tags: ['视觉-语言-动作', '可供性学习', '灵巧操作', '主动感知']
    },
    en: {
      slot: 'Opening Talk',
      type: 'Research Talk',
      title: 'From perception to action with affordance learning',
      abstract: 'Sailing works on affordance for manipulation and vision-language-action (VLA) systems. This talk connects perception to action for real-robot manipulation, focusing on affordance learning, active perception, and 2D-to-4D affordance flow, and drawing on recent work including A4A, A2A, and BridgeAct.',
      open: 'Open to campus',
      presenter: 'Sailing',
      affiliation: 'CASIA NLPR · Incoming PhD @ Tsinghua',
      bio: 'Sailing is a third-year Master\'s student at the National Laboratory of Pattern Recognition (NLPR), Institute of Automation, Chinese Academy of Sciences (CASIA), under the supervision of Prof. Wenzhao Lian. He is also a research intern at Rutgers University, an incoming PhD student at Tsinghua University, and a research intern at embodied foundation model in Tencent RoboticsX. His research interests include robot manipulation, dexterous manipulation, and vision-language-action (VLA), with a focus on multimodal perception and embodied intelligence for real-world robotic systems.',
      tags: ['VLA Systems', 'Affordance Learning', 'Dexterous Manipulation', 'Active Perception']
    }
  }
];

export function getTalkById(id) {
  return talks.find((talk) => talk.id === id) || null;
}

export function talksByStatus(status) {
  return talks.filter((talk) => talk.status === status);
}

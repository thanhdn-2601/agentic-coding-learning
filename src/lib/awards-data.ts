export type AwardUnit = 'Cá nhân' | 'Tập thể' | 'Cá nhân hoặc tập thể';

export interface AwardValue {
  individual?: string;
  team?: string;
  single?: string;
}

export interface Award {
  slug: string;
  name: string;
  navLabel: string;
  descriptions: string[];
  quantity: number;
  unit: AwardUnit;
  value: AwardValue;
  nameImage: string;
  figmaNodeId: string;
}

export const AWARDS: Award[] = [
  {
    slug: 'signature-2025',
    name: 'Signature 2025 - Creator',
    navLabel: 'Signature 2025 \nCreator',
    quantity: 1,
    unit: 'Cá nhân hoặc tập thể',
    descriptions: [
      'Giải thưởng Signature vinh danh cá nhân hoặc tập thể thể hiện tinh thần đặc trưng mà Sun* hướng tới trong từng thời kỳ.',
      'Trong năm 2025, giải thưởng Signature vinh danh Creator - cá nhân/tập thể mang tư duy chủ động và nhạy bén, luôn nhìn thấy cơ hội trong thách thức và tiên phong trong hành động. Họ là những người nhạy bén với vấn đề, nhanh chóng nhận diện và đưa ra những giải pháp thực tiễn, mang lại giá trị rõ rệt cho dự án, khách hàng hoặc tổ chức. Với tư duy kiến tạo và tinh thần "Creator" đặc trưng của Sun*, họ không chỉ phản ứng tích cực trước sự thay đổi mà còn chủ động tạo ra cải tiến, góp phần định hình chuẩn mực mới cho cách mà người Sun* tạo giá trị.',
    ],
    value: { individual: '5.000.000 VNĐ', team: '8.000.000 VNĐ' },
    nameImage: 'signature-2025',
    figmaNodeId: '313:8471',
  },
  {
    slug: 'top-talent',
    name: 'Top Talent',
    navLabel: 'Top Talent',
    quantity: 10,
    unit: 'Cá nhân',
    descriptions: [
      'Giải thưởng Top Talent vinh danh những cá nhân xuất sắc toàn diện – những người không ngừng khẳng định năng lực chuyên môn vững vàng, hiệu suất công việc vượt trội, luôn mang lại giá trị vượt kỳ vọng, được đánh giá cao bởi khách hàng và đồng đội. Với tinh thần sẵn sàng nhận mọi nhiệm vụ tổ chức giao phó, họ luôn là nguồn cảm hứng, thúc đẩy động lực và tạo ảnh hưởng tích cực đến cả tập thể.',
    ],
    value: { single: '7.000.000 VNĐ' },
    nameImage: 'top-talent',
    figmaNodeId: '313:8467',
  },
  {
    slug: 'top-project-leader',
    name: 'Top Project Leader',
    navLabel: 'Top Project\nLeader',
    quantity: 3,
    unit: 'Cá nhân',
    descriptions: [
      'Giải thưởng Top Project Leader vinh danh những nhà quản lý dự án xuất sắc – những người hội tụ năng lực quản lý vững vàng, khả năng truyền cảm hứng mạnh mẽ, và tư duy "Aim High – Be Agile" trong mọi bài toán và bối cảnh. Dưới sự dẫn dắt của họ, các thành viên không chỉ cùng nhau vượt qua thử thách và đạt được mục tiêu đề ra, mà còn giữ vững ngọn lửa nhiệt huyết, tinh thần Wasshoi, và trưởng thành để trở thành phiên bản tinh hoa – hạnh phúc hơn của chính mình.',
    ],
    value: { single: '7.000.000 VNĐ' },
    nameImage: 'top-project-leader',
    figmaNodeId: '313:8469',
  },
  {
    slug: 'best-manager',
    name: 'Best Manager',
    navLabel: 'Best Manager',
    quantity: 1,
    unit: 'Cá nhân',
    descriptions: [
      'Giải thưởng Best Manager vinh danh những nhà lãnh đạo tiêu biểu – người đã dẫn dắt đội ngũ của mình tạo ra kết quả vượt kỳ vọng, tác động nổi bật đến hiệu quả kinh doanh và sự phát triển bền vững của tổ chức. Dưới sự lãnh đạo của họ, đội ngũ luôn chinh phục và làm chủ mọi mục tiêu bằng năng lực đa nhiệm, khả năng phối hợp hiệu quả, và tư duy ứng dụng công nghệ linh hoạt trong kỷ nguyên số. Họ truyền cảm hứng để tập thể trở nên tự tin tràn đầy năng lượng, sẵn sàng đón nhận, thậm chí dẫn dắt tạo ra những thay đổi có tính cách mạng.',
    ],
    value: { single: '10.000.000 VNĐ' },
    nameImage: 'best-manager',
    figmaNodeId: '313:8470',
  },
  {
    slug: 'top-project',
    name: 'Top Project',
    navLabel: 'Top Project',
    quantity: 2,
    unit: 'Tập thể',
    descriptions: [
      'Giải thưởng Top Project vinh danh các tập thể dự án xuất sắc với kết quả kinh doanh vượt kỳ vọng, hiệu quả vận hành tối ưu và tinh thần làm việc tận tâm. Đây là các dự án có độ phức tạp kỹ thuật cao, hiệu quả tối ưu hóa nguồn lực và chi phí tốt, đề xuất các ý tưởng có giá trị cho khách hàng, đem lại lợi nhuận vượt trội và nhận được phản hồi tích cực từ khách hàng. Các thành viên tuân thủ nghiêm ngặt các tiêu chuẩn phát triển nội bộ trong phát triển dự án, tạo nên một hình mẫu về sự xuất sắc và chuyên nghiệp.',
    ],
    value: { single: '15.000.000 VNĐ' },
    nameImage: 'top-project',
    figmaNodeId: '313:8468',
  },
  {
    slug: 'mvp',
    name: 'MVP (Most Valuable Person)',
    navLabel: 'MVP',
    quantity: 1,
    unit: 'Cá nhân',
    descriptions: [
      'Giải thưởng MVP vinh danh cá nhân xuất sắc nhất năm – gương mặt tiêu biểu đại diện cho toàn bộ tập thể Sun*. Họ là người đã thể hiện năng lực vượt trội, tinh thần cống hiến bền bỉ, và tầm ảnh hưởng sâu rộng, để lại dấu ấn mạnh mẽ trong hành trình của Sun* suốt năm qua.',
      'Không chỉ nổi bật bởi hiệu suất và kết quả công việc, họ còn là nguồn cảm hứng lan tỏa – thông qua suy nghĩ, hành động và ảnh hưởng tích cực của mình đối với tập thể.',
      'MVP là người hội tụ đầy đủ phẩm chất của người Sun* ưu tú, đồng thời mang trên mình trọng trách lớn lao: trở thành hình mẫu đại diện cho con người và tinh thần Sun*, góp phần dẫn dắt tập thể vươn tới những đỉnh cao mới.',
    ],
    value: { single: '15.000.000 VNĐ' },
    nameImage: 'mvp',
    figmaNodeId: '313:8510',
  },
];

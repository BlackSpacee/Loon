let obj = JSON.parse($response.body);
const url = $request.url;

const sy = '/editors/risk_materials';
const my = 'api_info_types';

if (url.indexOf(sy) != -1) {
    obj.has_purchased = false;
    obj.risk_materials = [];
    obj.risk_fonts = [];
    obj.product_materials = [];
    obj.user_right = null;
    obj.risk_fonts = [];
    $done({ body: JSON.stringify(obj) });
} else if (url.indexOf(my) != -1) {
    let body = $response.body;
    body = body.replace(/"product_name":"免费版·个人"/g, '"product_name":"团队版·终身"');
    body = body.replace(/"is_expired":\w+/g, '"is_expired":true');
    body = body.replace(/"lifetime_vip":\w+/g, '"lifetime_vip":true');
    $done({ body });
}

#!/bin/bash

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 패키지 디렉토리로 이동
PACKAGE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ROOT_DIR="$(cd "$PACKAGE_DIR/../.." && pwd)"

echo -e "${YELLOW}🚀 @cp949/web-logger 배포 준비 중...${NC}"

# 1. 의존성 설치 (루트에서)
echo -e "${GREEN}📦 의존성 설치 중...${NC}"
cd "$ROOT_DIR" && pnpm install

# 2. 타입 체크
echo -e "${GREEN}🔍 타입 체크 중...${NC}"
cd "$PACKAGE_DIR" && pnpm run typecheck
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 타입 체크 실패${NC}"
    exit 1
fi

# 3. 빌드
echo -e "${GREEN}🔨 빌드 중...${NC}"
cd "$PACKAGE_DIR" && pnpm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 빌드 실패${NC}"
    exit 1
fi

# 4. 테스트 (테스트가 있는 경우)
# echo -e "${GREEN}🧪 테스트 실행 중...${NC}"
# cd "$PACKAGE_DIR" && pnpm run test
# if [ $? -ne 0 ]; then
#     echo -e "${RED}❌ 테스트 실패${NC}"
#     exit 1
# fi

# 5. 버전 확인
echo -e "${GREEN}📋 현재 버전 정보:${NC}"
cd "$PACKAGE_DIR"
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "현재 버전: ${YELLOW}v${CURRENT_VERSION}${NC}"

# 6. 버전 업데이트 확인
echo -e "${YELLOW}버전을 업데이트 하시겠습니까? (major/minor/patch/no):${NC}"
read VERSION_UPDATE

if [ "$VERSION_UPDATE" != "no" ]; then
    cd "$PACKAGE_DIR" && pnpm version $VERSION_UPDATE
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 버전 업데이트 실패${NC}"
        exit 1
    fi
    NEW_VERSION=$(node -p "require('./package.json').version")
    echo -e "${GREEN}✅ 버전 업데이트: v${CURRENT_VERSION} → v${NEW_VERSION}${NC}"
fi

# 7. 배포
echo -e "${YELLOW}npmjs에 배포하시겠습니까? (y/n):${NC}"
read CONFIRM

if [ "$CONFIRM" = "y" ]; then
    echo -e "${GREEN}📤 npmjs에 배포 중...${NC}"
    cd "$PACKAGE_DIR" && pnpm publish --access public
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 배포 성공!${NC}"
        echo -e "${GREEN}패키지: @cp949/web-logger@$(node -p "require('./package.json').version")${NC}"
        echo -e "${GREEN}레지스트리: https://www.npmjs.com/package/@cp949/web-logger${NC}"
    else
        echo -e "${RED}❌ 배포 실패${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⏭️  배포를 건너뛰었습니다.${NC}"
fi

echo -e "${GREEN}✨ 완료!${NC}"

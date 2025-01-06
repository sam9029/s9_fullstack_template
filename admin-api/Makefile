HUBDOMAIN=registry.cn-beijing.aliyuncs.com/yoboo/koc
# TAG :=latest
# TAG := $(shell /bin/date "+%s")
IMAGE=$(HUBDOMAIN):latest
TESTIMG=$(HUBDOMAIN):test

define buildFunction
	docker build -f $(2) -t $(1) .
	docker push $(1)
endef

release:
	$(call buildFunction, $(IMAGE), ./Dockerfile)
	
release-test:
	$(call buildFunction, $(TESTIMG), ./DockerfileTest)
